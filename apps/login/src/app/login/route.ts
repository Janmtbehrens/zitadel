import { isRSCRequest, validateAuthRequest } from "@/lib/auth-utils";
import { getAllSessions } from "@/lib/cookies";
import { createLogger } from "@/lib/logger";
import { FlowInitiationParams, handleOIDCFlowInitiation, handleSAMLFlowInitiation } from "@/lib/server/flow-initiation";
import { getServiceConfig } from "@/lib/service-url";
import { listSessions, ServiceConfig } from "@/lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { createHash } from "node:crypto";
import postgres from "postgres";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = false;
export const fetchCache = "default-no-store";

const logger = createLogger("login-route");

async function loadSessions({ serviceConfig, ids }: { serviceConfig: ServiceConfig; ids: string[] }): Promise<Session[]> {
  const response = await listSessions({ serviceConfig, ids: ids.filter((id: string | undefined) => !!id) });

  return response?.sessions ?? [];
}
const sql = postgres({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.PGPASSWORD,
});
const HEADERS = {
  Authorization: `Bearer ${process.env.ZITADEL_SERVICE_USER_TOKEN}`,
  "Content-Type": "application/json",
  "x-zitadel-instance-host": `${process.env.IDP_EXTERNAL_HOST}`
};

async function zitadel(method: string, path: string, body: unknown) {
  const res = await fetch(`${process.env.IDP_URL_INTERNAL}${path}`, {
    method, headers: HEADERS, body: JSON.stringify(body), cache: "no-store",
  });
  if (!res.ok) throw new Error(`Zitadel ${res.status}: ${await res.text()}`);
  return res.json();
}

async function magicLogin(authRequestId: string, token: string): Promise<string> {
  const hash = createHash("sha256").update(token).digest("hex");
  const expiry = process.env.MAGIC_LINK_EXPIRY_TIME ?? "72 hours";
  const [row] = await sql`
  DELETE FROM magic_links
  WHERE token_hash = ${hash} AND "timestamp" > now() - ${expiry}::interval
  RETURNING idp_id`;
  if (!row) {
    throw new Error("invalid or expired link");
  }
  const created = await zitadel("POST", "/v2/sessions", {
    checks: { user: { userId: row.idp_id } },
    challenges: { otpEmail: { returnCode: {} } },
    lifetime: "28800s",
  });
  const checked = await zitadel("PATCH", `/v2/sessions/${created.sessionId}`, {
    checks: { otpEmail: { code: created.challenges.otpEmail } },
  });
  const { callbackUrl } = await zitadel("POST", `/v2/oidc/auth_requests/${authRequestId}`, {
    session: { sessionId: created.sessionId, sessionToken: checked.sessionToken },
  });
  return callbackUrl;
}

export async function GET(request: NextRequest) {
  const authRequestId = request.nextUrl.searchParams.get("authRequest");
  const magicToken = request.cookies.get("magic_link")?.value;
  if (authRequestId && magicToken) {
    const target = await magicLogin(authRequestId, magicToken).catch((e) => {
      console.error("Magic link visit error: " + e);
      return null
    });
    const baseURL = process.env.IDP_URL_EXTERNAL ?? "Redirect error";

    const res = NextResponse.redirect(target ?? baseURL);
    res.cookies.delete("magic_link");
    if (!target) {
      res.cookies.set("magic_link_invalid", "1", { path: "/", maxAge: 60, sameSite: "lax", secure: true });
    }
    return res;
  }
  const { serviceConfig } = getServiceConfig(request.headers);

  const searchParams = request.nextUrl.searchParams;

  // Defensive check: block RSC requests early
  if (isRSCRequest(searchParams)) {
    return NextResponse.json({ error: "RSC requests not supported" }, { status: 400 });
  }

  // Early validation: if no valid request parameters, return error immediately
  const requestId = validateAuthRequest(searchParams);
  if (!requestId) {
    return NextResponse.json({ error: "No valid authentication request found" }, { status: 400 });
  }

  const sessionCookies = await getAllSessions();
  const ids = sessionCookies.map((s) => s.id);
  let sessions: Session[] = [];
  if (ids && ids.length) {
    try {
      sessions = await loadSessions({ serviceConfig, ids });
    } catch (error) {
      logger.warn("Failed to load sessions", { error });
      // listSessions can fail for various reasons (stale/expired session IDs
      // still in cookies, API errors, etc.).  Treat any failure as "no valid
      // sessions" so the user is redirected to loginname instead of a 500.
      sessions = [];
    }
  }

  // Flow initiation - delegate to appropriate handler
  const flowParams: FlowInitiationParams = { serviceConfig, requestId, sessions, sessionCookies, request };

  try {
    if (requestId.startsWith("oidc_")) {
      return await handleOIDCFlowInitiation(flowParams);
    } else if (requestId.startsWith("saml_")) {
      return await handleSAMLFlowInitiation(flowParams);
    } else if (requestId.startsWith("device_")) {
      // Device Authorization does not need to start here as it is handled on the /device endpoint
      return NextResponse.json({ error: "Device authorization should use /device endpoint" }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
    }
  } catch (error: unknown) {
    logger.error("Flow initiation failed", { requestId, error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
