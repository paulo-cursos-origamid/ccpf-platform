"use client";

import styles from "./ThemeSwitch.module.scss";

import { useThemeStore } from "@/stores/theme.store";

export function ThemeSwitch() {
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  return (
    <button className={styles.button} onClick={toggleTheme}>
      Tema
    </button>
  );
}
