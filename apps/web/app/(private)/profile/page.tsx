"use client";

import { useState } from "react";

import {
  ChangePasswordForm,
  ProfileDetails,
  ProfileForm,
} from "@/modules/profile";

import styles from "./page.module.scss";

type ProfileView = "details" | "edit" | "password";

export default function ProfilePage() {
  const [view, setView] = useState<ProfileView>("details");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Meu perfil</h1>

          <p className={styles.description}>
            Gerencie suas informações pessoais e as configurações de segurança
            da sua conta.
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {view === "details" && (
          <ProfileDetails
            onEdit={() => setView("edit")}
            onChangePassword={() => setView("password")}
          />
        )}

        {view === "edit" && (
          <ProfileForm
            onSuccess={() => setView("details")}
            onCancel={() => setView("details")}
          />
        )}

        {view === "password" && (
          <ChangePasswordForm
            onSuccess={() => setView("details")}
          />
        )}
      </div>
    </main>
  );
}
