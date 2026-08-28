"use client";

import { Trash2 } from "@/components/icons";
import { Modal } from "@/components/ui/overlay/Modal";

import { useDeleteUser } from "@/modules/identity/hooks";
import type { UserListItem } from "@/modules/identity/types/user-list";

import styles from "./ConfirmDeleteUserModal.module.scss";

interface ConfirmDeleteUserModalProps {
  user: UserListItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function ConfirmDeleteUserModal({
  user,
  open,
  onClose,
  onSuccess,
}: ConfirmDeleteUserModalProps) {
  const { remove, loading, error } = useDeleteUser();

  if (!user || !open) {
    return null;
  }

  const userToDelete = user;

  async function handleDelete() {
    try {
      await remove(userToDelete.id);

      await onSuccess();

      onClose();
    } catch {
      // O erro já está disponível através do hook.
    }
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : error
        ? "Não foi possível remover o usuário."
        : null;

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title="Remover usuário"
      closeOnOverlayClick={!loading}
    >
      <div className={styles.container}>
        <div className={styles.icon}>
          <Trash2 size={22} strokeWidth={1.8} />
        </div>

        <div className={styles.content}>
          <h3>Remover usuário?</h3>

          <p>
            Você está prestes a remover o usuário{" "}
            <strong>{userToDelete.name}</strong>.
          </p>

          <p>
            O usuário será removido da plataforma, mas os dados serão
            preservados.
          </p>
        </div>

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={16} strokeWidth={1.8} />

            {loading ? "Removendo..." : "Remover usuário"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
