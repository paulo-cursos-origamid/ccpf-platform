"use client";

import { useCallback } from "react";
import { ArrowLeft, CheckCheck } from "@/components/icons";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks";
import { NotificationItem } from "../NotificationItem";

import styles from "./NotificationCenter.module.scss";

// Componente responsável pela Central de Avisos.
//
// Exibe todas as notificações do usuário autenticado e concentra
// as ações de leitura individual e leitura em massa.
export function NotificationCenter() {
  const {
    notifications,
    loading,
    error,
    reload,
  } = useNotifications();

  const {
    count: unreadCount,
    reload: reloadUnreadCount,
  } = useUnreadNotificationCount();

  const {
    markAsRead,
    loading: markingAsRead,
  } = useMarkNotificationAsRead();

  const {
    markAllAsRead,
    loading: markingAllAsRead,
  } = useMarkAllNotificationsAsRead();

  const refreshNotifications = useCallback(async () => {
    await Promise.all([reload(), reloadUnreadCount()]);
  }, [reload, reloadUnreadCount]);

  async function handleMarkAsRead(notificationId: string) {
    await markAsRead(notificationId);
    await refreshNotifications();
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    await refreshNotifications();
  }

  const allRead =
    notifications.length === 0 ||
    notifications.every((notification) => notification.readAt !== null);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => window.history.back()}
            >
              <ArrowLeft />
              Voltar
            </button>

            <h1 className={styles.title}>Central de Avisos</h1>

            <p className={styles.subtitle}>
              Acompanhe os avisos e eventos importantes da sua conta.
            </p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.counter}>
              {unreadCount}{" "}
              {unreadCount === 1 ? "aviso não lido" : "avisos não lidos"}
            </span>

            <button
              type="button"
              className={styles.markAllButton}
              onClick={() => void handleMarkAllAsRead()}
              disabled={markingAllAsRead || allRead}
            >
              <CheckCheck />
              {markingAllAsRead
                ? "Marcando..."
                : "Marcar todas como lidas"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {loading && (
          <div className={styles.state}>
            <span className={styles.spinner} />
            <p>Carregando avisos...</p>
          </div>
        )}

        {!loading && error != null && (
          <div className={styles.state}>
            <p className={styles.error}>
              Não foi possível carregar os avisos.
            </p>

            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void refreshNotifications()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && error == null && notifications.length === 0 && (
          <div className={styles.state}>
            <div className={styles.emptyIcon}>
              <CheckCheck />
            </div>

            <h2>Nenhum aviso</h2>

            <p>
              Você não possui avisos registrados no momento.
            </p>
          </div>
        )}

        {!loading && error == null && notifications.length > 0 && (
          <div className={styles.list}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                markingAsRead={markingAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
