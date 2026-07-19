import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import styles from "./Header.module.scss";
import { Bell, User } from "@/components/icons";

export function Header() {
  return (
    <header className={styles.header}>
      <div>CCPF</div>
      <div>
        <ThemeSwitch />
      </div>

      <Bell />
      <div>
        <User />
      </div>
    </header>
  );
}
