"use client";

import { useState } from "react";

import { Button, Field, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import { tenantService } from "../../../services/tenant.service";
import type { TenantRole } from "../../../types";

import styles from "./AddTenantMemberModal.module.scss";

interface Props {
  open: boolean;
  role: Exclude<TenantRole, "OWNER">;
  onClose: () => void;
  onCreated: (user: { id: string; name: string; email: string }) => Promise<void> | void;
}

export function CreateTenantMemberUserModal({
  open,
  role,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await tenantService.createMemberUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      await onCreated(user);
      setName("");
      setEmail("");
      setPassword("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o usuário neste espaço.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Criar usuário neste espaço"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Este cadastro ficará vinculado a este espaço. O usuário criado não
          poderá administrar outros membros.
        </p>

        <Field label="Nome" htmlFor="tenant-created-user-name" required>
          <input
            id="tenant-created-user-name"
            className={styles.localInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            disabled={loading}
          />
        </Field>

        <Field label="E-mail" htmlFor="tenant-created-user-email" required>
          <input
            id="tenant-created-user-email"
            className={styles.localInput}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />
        </Field>

        <Field
          label="Senha inicial"
          htmlFor="tenant-created-user-password"
          required
        >
          <input
            id="tenant-created-user-password"
            className={styles.localInput}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
            disabled={loading}
          />
        </Field>

        <Field label="Função no espaço" htmlFor="tenant-created-user-role">
          <Select id="tenant-created-user-role" value={role} disabled>
            <option value={role}>
              {role === "ADMIN"
                ? "Administrador"
                : role === "VIEWER"
                  ? "Visualizador"
                  : "Membro"}
            </option>
          </Select>
        </Field>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Criar usuário
          </Button>
        </div>
      </form>
    </Modal>
  );
}
