import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div>CCPF</div>
      <div>
        <ThemeSwitch />
      </div>
      <div>Usuário</div>
    </header>
  );
}
