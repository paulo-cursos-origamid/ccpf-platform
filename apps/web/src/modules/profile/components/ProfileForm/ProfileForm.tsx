"use client";

import { useState } from "react";

import { Button, Card, EmailInput, Field, Input } from "@/components/ui";

import { useProfile, useUpdateProfile } from "@/modules/profile/hooks/client";

import styles from "./ProfileForm.module.scss";
import { UserRound } from "@/components/icons";

type ProfileFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

function ProfileFields({
  name: initialName,
  email: initialEmail,
  onSubmit,
  loading,
  error,
  successMessage,
}: {
  name: string;
  email: string;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      name: name.trim(),
      email: email.trim(),
    });
  }

  return (
    <>
      {error && <div className={styles.error}>{error}</div>}

      {successMessage && (
        <div className={styles.success} role="status">
          {successMessage}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Nome" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            leftIcon={<UserRound />}
            disabled={loading}
            autoComplete="name"
            required
          />
        </Field>

        <Field label="E-mail" htmlFor="profile-email" required>
          <EmailInput
            id="profile-email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            autoComplete="email"
            required
          />
        </Field>

        <div className={styles.actions}>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || Boolean(successMessage)}
          >
            Salvar alterações
          </Button>
        </div>
      </form>
    </>
  );
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile();

  const {
    updateProfile,
    loading: updateLoading,
    error: updateError,
  } = useUpdateProfile();

  const [successMessage, setSuccessMessage] = useState("");

  const error = getErrorMessage(profileError ?? updateError);

  async function handleSubmit(data: { name: string; email: string }) {
    setSuccessMessage("");

    try {
      await updateProfile(data);

      setSuccessMessage("Perfil atualizado com sucesso.");

      window.setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      // O erro já é tratado pelo hook.
    }
  }

  const loading = profileLoading || updateLoading;

  return (
    <Card className={styles.card} outlined>
      <div className={styles.header}>
        <h2 className={styles.title}>Dados pessoais</h2>

        <p className={styles.description}>
          Atualize suas informações pessoais.
        </p>
      </div>

      {profile ? (
        <ProfileFields
          key={profile.id}
          name={profile.name}
          email={profile.email}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          successMessage={successMessage}
        />
      ) : profileLoading ? (
        <div className={styles.loading}>Carregando perfil...</div>
      ) : (
        error && <div className={styles.error}>{error}</div>
      )}
    </Card>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Não foi possível atualizar o perfil.";
}
