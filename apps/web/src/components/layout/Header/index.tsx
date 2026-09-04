"use client";

import { useRouter } from "next/navigation";

import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Bell, User } from "@/components/icons";

import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import styles from "./Header.module.scss";

export function Header() {
  const router = useRouter();

  const logout = useIdentityStore((state) => state.logout);

  const user = useIdentityStore((state) => state.user);

  async function handleLogout() {
    await logout();

    router.replace("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>CCPF</span>
      </div>

      <div className={styles.right}>
        <ThemeSwitch />

        <button type="button" className={styles.iconButton}>
          <Bell />
        </button>

        {/* <div className={styles.user}>
          <User />

          <span className={styles.userName}>{user?.name}</span>

          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
          >
            Sair
          </button>
        </div> */}
        <div className={styles.user}>
          <button
            type="button"
            className={styles.userProfile}
            onClick={() => router.push("/profile")}
            aria-label="Abrir meu perfil"
          >
            <User />
            <span className={styles.userName}>{user?.name}</span>
          </button>

          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
