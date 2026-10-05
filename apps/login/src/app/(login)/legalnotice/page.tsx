import { DynamicTheme } from "@/components/dynamic-theme";
import { OpenSlidesThemeProvider } from "@/components/openslides-theme";
import { getBrandingSettings } from "@/lib/zitadel";
import { getServiceConfig } from "@/lib/service-url";
import { getThemeData } from "@/lib/theme-data";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import styles from './page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function LegalNoticePage() {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);
  const branding = await getBrandingSettings({ serviceConfig });
  const themeData = await getThemeData();

  console.log("Legal Notice")
  console.log(themeData)
  return (
    <DynamicTheme branding={branding}>
      <OpenSlidesThemeProvider themeData={themeData}>
        <div className="flex flex-col space-y-4">
          <h1 className="center spacer-top-20">Legal notice</h1>
          <div className="underlined-links">
            <div className={styles.legalnotice_text}>
              <div dangerouslySetInnerHTML={{ __html: themeData?.legal_notice ?? "---" }} />
            </div>
            <div className={styles. mat_divider_horizontal} role="separator" aria-orientation="horizontal"></div>
            <div className={styles.version_text}>
                      OpenSlides Version:
                      <a
                          className="italic"
                          href="https://support.openslides.com/help/de-de/45-uber-openslides/80-versionshistorie"
                          target="_blank"
                      >
                          4.3.4 (2026-09-23)
                      </a>
                  </div>
                  <a href="https://support.openslides.com/help/" target="_blank">
                      <br />
                      <div className={styles.detail_link}>
                          'OpenSlides help (FAQ)'
                      </div>
                  </a>
          </div>
        </div>
      </OpenSlidesThemeProvider>
    </DynamicTheme>
  );
}
