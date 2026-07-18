"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/stores/theme.store";

interface Props {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: Props) {

  const theme = useThemeStore(
    (state) => state.theme
  );


  useEffect(() => {

    document.documentElement.dataset.theme = theme;

  }, [theme]);


  return children;
}