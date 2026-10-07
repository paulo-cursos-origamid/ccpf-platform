"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { CheckCheck, X } from "@/components/icons";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks";

import { NotificationItem } from "../NotificationItem";

import styles from "./NotificationDropdown.module.scss";

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dropdown da Central de Avisos.
 *
 * Exibe as notificações recentes e concentra as ações rápidas
 * relacionadas à leitura das notificações.
 */
export function NotificationDropdown({
  open,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    loading,
    error,
    reload,
  } = useNotifications();

  const { markAsRead } = useMarkNotificationAsRead();
  const { markAllAsRead, loading: markingAllAsRead } =
    useMarkAllNotificationsAsRead();
  const { reload: reloadUnreadCount } = useUnreadNotificationCount();

  useEffect(() => {
    if (!open) {
      return;
    }

    void reload();
  }, [open, reload]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleMarkAsRead(notificationId: string) {
    await markAsRead(notificationId);

    await Promise.all([reload(), reloadUnreadCount()]);
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();

    await Promise.all([reload(), reloadUnreadCount()]);
  }

  function handleViewAll() {
    onClose();
    router.push("/admin/notifications");
  }

  return (
    <div
      ref={containerRef}
      className={styles.dropdown}
      role="dialog"
      aria-label="Central de Avisos"
    >
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Notificações</h2>
          <p className={styles.subtitle}>Central de Avisos</p>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar notificações"
        >
          <X />
        </button>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={() => void handleMarkAllAsRead()}
          disabled={markingAllAsRead || notifications.every(
            (notification) => notification.readAt !== null,
          )}
        >
          <CheckCheck />
          Marcar todas como lidas
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.feedback}>Carregando notificações...</div>
        ) : error ? (
          <div className={styles.feedback}>
            Não foi possível carregar as notificações.
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.feedback}>
            <strong>Nenhuma notificação</strong>
            <span>Você está em dia.</span>
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.viewAllButton}
          onClick={handleViewAll}
        >
          Ver todas as notificações
        </button>
      </footer>
    </div>
  );
}
