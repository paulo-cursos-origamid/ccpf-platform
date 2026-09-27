"use client";

import { Moon, Sun } from "@/components/icons";
import { useThemeStore } from "@/stores/theme.store";

import styles from "./ThemeSwitch.module.scss";

/**
 * Controle global de alternância entre tema claro e escuro.
 *
 * Responsabilidades:
 * - ler o tema atual do Zustand;
 * - alternar entre light e dark;
 * - disponibilizar um controle reutilizável para qualquer área da aplicação.
 *
 * A aplicação efetiva do tema permanece sob responsabilidade do
 * ThemeProvider, que atualiza o atributo data-theme no elemento <html>.
 */
export function ThemeSwitch() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isLightTheme = theme === "light";

  return (
    <button
      type="button"
      className={styles.button}
      onClick={toggleTheme}
      aria-label={isLightTheme ? "Ativar tema escuro" : "Ativar tema claro"}
      title={isLightTheme ? "Ativar tema escuro" : "Ativar tema claro"}
    >
      {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
