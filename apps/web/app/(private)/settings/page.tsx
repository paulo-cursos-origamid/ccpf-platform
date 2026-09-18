import Link from "next/link";

import { Users, Settings as SettingsIcon } from "@/components/icons";

import styles from "./page.module.scss";

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      {" "}
      <header className={styles.header}>
        {" "}
        <div className={styles.headerIcon}>
          {" "}
          <SettingsIcon size={24} />{" "}
        </div>
        <div>
          <h1>Configurações</h1>

          <p>
            Gerencie as configurações do Espaço e o acesso dos seus membros.
          </p>
        </div>
      </header>
      <section className={styles.section}>
        <h2>Gerenciamento</h2>

        <div className={styles.grid}>
          <Link href="/settings/members" className={styles.card}>
            <span className={styles.cardIcon}>
              <Users size={22} />
            </span>

            <span className={styles.cardContent}>
              <strong>Membros</strong>

              <span>Gerencie os usuários, funções e acessos deste Espaço.</span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
