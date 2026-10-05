import { DynamicTheme } from "@/components/dynamic-theme";
import { OpenSlidesThemeProvider } from "@/components/openslides-theme";
import { getBrandingSettings } from "@/lib/zitadel";
import { getServiceConfig } from "@/lib/service-url";
import { getThemeData } from "@/lib/theme-data";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function PrivacyPolicyPage() {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);
  const branding = await getBrandingSettings({ serviceConfig });
  const themeData = await getThemeData();

  console.log("Privacy Policy")
  console.log(themeData)
  return (
    <DynamicTheme branding={branding}>
      <OpenSlidesThemeProvider themeData={themeData}>
        <div className="flex flex-col space-y-4">
          <div className="action-title">
            <h1>Privacy policy</h1>
          </div>
          <div className="underlined-links">
            <p> { themeData?.privacy_policy ?? "---" } </p>
          </div>
        </div>
      </OpenSlidesThemeProvider>
    </DynamicTheme>
  );
}
