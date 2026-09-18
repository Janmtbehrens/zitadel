export type DesignData = Record<string, unknown>;

const THEME_REQUEST_FIELDS = [
  "accent_100",
  "accent_200",
  "accent_300",
  "accent_400",
  "accent_50",
  "accent_500",
  "accent_600",
  "accent_700",
  "accent_800",
  "accent_900",
  "accent_a100",
  "accent_a200",
  "accent_a400",
  "accent_a700",

  "primary_100",
  "primary_200",
  "primary_300",
  "primary_400",
  "primary_50",
  "primary_500",
  "primary_600",
  "primary_700",
  "primary_800",
  "primary_900",
  "primary_a100",
  "primary_a200",
  "primary_a400",
  "primary_a700",

  "warn_100",
  "warn_200",
  "warn_300",
  "warn_400",
  "warn_50",
  "warn_500",
  "warn_600",
  "warn_700",
  "warn_800",
  "warn_900",
  "warn_a100",
  "warn_a200",
  "warn_a400",
  "warn_a700",

  "headbar",
  "yes",
  "no",
  "abstain",

  "theme_for_organization_id",
  "organization_id",
] as const;



const AUTOUPDATE_URL =
  process.env.OPENSLIDES_AUTOUPDATE_URL ??
  "http://autoupdate:9012/system/autoupdate";

function createRequestBody() {
  const fields: Record<string, unknown> = {};

  for (const fieldName of THEME_REQUEST_FIELDS) {
    fields[fieldName] = null;
  }
  // TODO: Organisation ID is fixed right now, should this change?
  return [
    {
      collection: "organization",
      ids: [1],
      fields: {
        theme_id: {
          type: "relation",
          collection: "theme",
          fields,
        }
      },
    }
  ];
}

async function fetchDesignData(): Promise<DesignData> {
  const response = await fetch(AUTOUPDATE_URL + "/system/autoupdate?single=1", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createRequestBody())
  });

  if (!response.ok) {
    throw new Error(`OpenSlides returned HTTP ${response.status}`);
  }

  const responseBody: unknown = await response.json();

  if (!responseBody || typeof responseBody !== "object") {
    throw new Error("OpenSlides returned an invalid response");
  }

  return responseBody as DesignData;
}

let cachedDesignData: Promise<DesignData> | undefined;

export function getDesignData(): Promise<DesignData> {
  if (!cachedDesignData) {
    cachedDesignData = fetchDesignData().catch((error) => {
      console.error("Could not load OpenSlides theme data:", error);

      return {};
    });
  }

  return cachedDesignData;
}
