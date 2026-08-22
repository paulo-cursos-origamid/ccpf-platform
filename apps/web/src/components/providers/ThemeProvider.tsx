"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/stores/theme.store";

interface Props {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme !== "system") {
      root.dataset.theme = theme;
      return;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const applySystemTheme = () => {
      root.dataset.theme = mediaQuery.matches ? "dark" : "light";
    };

    applySystemTheme();

    mediaQuery.addEventListener("change", applySystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", applySystemTheme);
    };
  }, [theme]);

  return children;
}