"use client";

import { useSyncExternalStore } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { getForcedTheme, getServerForcedTheme, subscribeForcedTheme } from "@/lib/forced-theme";

/** next-themes, with a page-level override (the widget's `theme` param) through lib/forced-theme. */
export function ThemeProvider({ children, forcedTheme, ...props }: ThemeProviderProps) {
  const pageTheme = useSyncExternalStore(subscribeForcedTheme, getForcedTheme, getServerForcedTheme);
  return (
    <NextThemesProvider {...props} forcedTheme={pageTheme ?? forcedTheme}>
      {children}
    </NextThemesProvider>
  );
}
