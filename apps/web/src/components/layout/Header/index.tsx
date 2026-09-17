"use client";

import { useRouter } from "next/navigation";

import { Bell, User } from "@/components/icons";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";
import { TenantSelector } from "@/modules/tenant";

import styles from "./Header.module.scss";

// Componente responsável pelo cabeçalho principal da aplicação.
//
// O Header concentra ações globais da interface:
// - identificação visual do sistema;
// - seleção do Tenant ativo;
// - troca de tema;
// - notificações;
// - acesso ao perfil;
// - logout.
//
// A lógica de seleção do Tenant pertence ao TenantSelector.
export function Header() {
  const router = useRouter();

  const logout = useIdentityStore((state) => state.logout);
  const user = useIdentityStore((state) => state.user);

  // Encerra a sessão e retorna o usuário para a tela de login.
  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className={styles.header}>
      {" "}
      <div className={styles.left}>
        {" "}
        <span className={styles.logo}>CCPF</span>
        <TenantSelector />
      </div>
      <div className={styles.right}>
        <ThemeSwitch />

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Notificações"
        >
          <Bell />
        </button>

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
