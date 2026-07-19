"use client";

import {
  Moon,
  Sun,
} from "@/components/icons";


import {
  useThemeStore
} from "@/stores/theme.store";


import styles from "./ThemeSwitch.module.scss";


export function ThemeSwitch(){

  const theme = useThemeStore(
    state => state.theme
  );


  const toggleTheme = useThemeStore(
    state => state.toggleTheme
  );


  return (

    <button
      className={styles.button}
      onClick={toggleTheme}
    >

      {
        theme === "light"
        ?
        <Moon size={18}/>
        :
        <Sun size={18}/>
      }

    </button>

  );

}