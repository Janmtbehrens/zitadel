"use client";

import { createContext, ReactNode, useContext } from "react";
import type { ThemeData } from "@/lib/theme-data";

const default_background_light: string = "#fafafa";
const default_background_dark: string = "#393b3d";

export function applyOpenSlidesColors(document: Document, themeData: ThemeData) {
    const root = document.documentElement;

    // Set Default CSS Properties
    root.style.setProperty(`--theme-light-background-600`, default_background_light);
    root.style.setProperty(`--theme-dark-background-600`, default_background_dark);

    // Create/ Overwrite CSS Properties with OpenSlides Theme Variables
    for (const [key, value] of Object.entries(themeData)) {
        if (typeof value === "string") {
            const normalizedKey: string = key.replaceAll("_", "-");
            root.style.setProperty(`--theme-light-${normalizedKey}`, value);
            root.style.setProperty(`--theme-dark-${normalizedKey}`, value);
        }
    }
}
const OpenSlidesThemeContext = createContext<ThemeData>({});

type OpenSlidesThemeProviderProps = {
  themeData: ThemeData;
  children: ReactNode;
};

export function OpenSlidesThemeProvider({
  themeData,
  children,
}: OpenSlidesThemeProviderProps) {
  return (
    <OpenSlidesThemeContext.Provider value={themeData}>
      {children}
    </OpenSlidesThemeContext.Provider>
  );
}

export function useOpenSlidesTheme(): ThemeData {
  return useContext(OpenSlidesThemeContext);
}
