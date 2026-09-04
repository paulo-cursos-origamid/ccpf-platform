"use client";

import { Button } from "@/components/ui/forms/Button";
import { useProfile } from "@/modules/profile/hooks/client";

import styles from "./ProfileDetails.module.scss";
import { LockKeyhole } from "@/components/icons";

interface ProfileDetailsProps {
  onEdit: () => void;
  onChangePassword: () => void;
}

export function ProfileDetails({
  onEdit,
  onChangePassword,
}: ProfileDetailsProps) {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>Carregando seus dados...</div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className={styles.card}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>
            Não foi possível carregar seus dados
          </h2>

          <p className={styles.emptyDescription}>
            Tente novamente em alguns instantes.
          </p>
        </div>
      </section>
    );
  }

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  return (
    <div className={styles.container}>
      {/* Profile header */}
      <section className={styles.profileCard}>
        <div className={styles.profileIdentity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials}
          </div>

          <div className={styles.identity}>
            <h2 className={styles.name}>{profile.name}</h2>

            <p className={styles.email}>{profile.email}</p>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={onEdit}>
          Editar dados
        </Button>
      </section>

      {/* Personal information */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Informações pessoais</h2>

            <p className={styles.cardDescription}>
              Informações utilizadas para identificar sua conta.
            </p>
          </div>
        </header>

        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.label}>Nome</span>
            <span className={styles.value}>{profile.name}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.field}>
            <span className={styles.label}>E-mail</span>
            <span className={styles.value}>{profile.email}</span>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Segurança</h2>

            <p className={styles.cardDescription}>
              Gerencie a segurança e as credenciais da sua conta.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={onChangePassword}>
            Alterar senha
          </Button>
        </header>

        <div className={styles.securityItem}>
          <div className={styles.securityIcon} aria-hidden="true">
            <LockKeyhole size={18} />
          </div>
          <div className={styles.securityContent}>
            <span className={styles.label}>Senha</span>

            <span className={styles.securityDescription}>
              Sua senha é protegida e nunca é exibida.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
