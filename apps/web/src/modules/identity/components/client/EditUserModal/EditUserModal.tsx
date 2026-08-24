"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/overlay/Modal";
import { Input } from "@/components/ui/forms/Input";
import { Select } from "@/components/ui/forms/Select";
import { Switch } from "@/components/ui/forms/Switch";
import { Field } from "@/components/ui/forms/Field";

import { useUpdateUser } from "@/modules/identity/hooks";
import {
  UserRole,
  type UserListItem,
} from "@/modules/identity/types/user-list";

import styles from "./EditUserModal.module.scss";

interface EditUserModalProps {
  user: UserListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (user: UserListItem) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  SUPPORT: "Suporte",
};

export function EditUserModal({
  user,
  open,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  if (!user) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar usuário">
      <EditUserForm
        key={user.id}
        user={user}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}

interface EditUserFormProps {
  user: UserListItem;
  onClose: () => void;
  onSuccess: (user: UserListItem) => void;
}

function EditUserForm({ user, onClose, onSuccess }: EditUserFormProps) {
  const { update, loading, error } = useUpdateUser();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const updatedUser = await update(user.id, {
        name: name.trim(),
        email: email.trim(),
        role,
        isActive,
      });

      onSuccess(updatedUser);
    } catch {
      // O erro já está disponível através do hook.
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Field label="Nome" htmlFor="edit-user-name" required>
        <Input
          id="edit-user-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          disabled={loading}
        />
      </Field>

      <Field label="E-mail" htmlFor="edit-user-email" required>
        <Input
          id="edit-user-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />
      </Field>

      <Field label="Perfil" htmlFor="edit-user-role" required>
        <Select
          id="edit-user-role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          disabled={loading}
        >
          {Object.values(UserRole).map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>

      <Switch
        name="isActive"
        checked={isActive}
        onChange={(event) => setIsActive(event.target.checked)}
        disabled={loading}
        label="Usuário ativo"
      />

      {error && (
        <div className={styles.error}>
          Não foi possível atualizar o usuário.
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" onClick={onClose} disabled={loading}>
          Cancelar
        </button>

        <button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
