"use client";

import { createContext, ReactNode, useContext } from "react";
import type { ThemeData } from "@/lib/theme-data";

export function applyOpenSlidesColors(document: Document, themeData: ThemeData) {
  const root = document.documentElement;

  if (typeof themeData.primary_500 === "string") {
    root.style.setProperty("--theme-light-primary-500", themeData.primary_500);
    root.style.setProperty("--theme-dark-primary-500", themeData.primary_500);
  }

  if (typeof themeData.warn_500 === "string") {
    root.style.setProperty("--theme-light-warn-500", themeData.warn_500);
    root.style.setProperty("--theme-dark-warn-500", themeData.warn_500);
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
