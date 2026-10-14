"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCheck, Trash2 } from "@/components/icons";

import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../../hooks";
import { notificationService } from "../../services";
import type { Notification } from "../../types";
import { getNotificationNavigationPath } from "../../utils";
import { NotificationItem } from "../NotificationItem";
import styles from "./NotificationCenter.module.scss";

export function NotificationCenter() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { notifications, meta, loading, error, reload } = useNotifications(page);
  const { count: unreadCount, reload: reloadUnreadCount } =
    useUnreadNotificationCount();
  const { markAsRead, loading: markingAsRead } = useMarkNotificationAsRead();
  const { markAllAsRead, loading: markingAllAsRead } =
    useMarkAllNotificationsAsRead();

  const refreshNotifications = useCallback(async () => {
    await Promise.all([reload(), reloadUnreadCount()]);
  }, [reload, reloadUnreadCount]);

  async function handleMarkAsRead(notificationId: string) {
    setActionError(null);
    try {
      await markAsRead(notificationId);
      await refreshNotifications();
    } catch {
      setActionError("Não foi possível marcar a notificação como lida.");
    }
  }

  async function handleMarkAllAsRead() {
    setActionError(null);
    try {
      await markAllAsRead();
      await refreshNotifications();
    } catch {
      setActionError("Não foi possível marcar as notificações como lidas.");
    }
  }

  async function handleOpen(notification: Notification) {
    setActionError(null);
    try {
      if (notification.readAt === null) {
        await markAsRead(notification.id);
        await refreshNotifications();
      }

      const path = getNotificationNavigationPath(
        notification.resourceType,
        notification.resourceId,
      );

      if (path) router.push(path);
    } catch {
      setActionError("Não foi possível abrir a notificação.");
    }
  }

  function toggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((selectedId) => selectedId !== id),
    );
  }

  const allPageSelected =
    notifications.length > 0 &&
    notifications.every((notification) => selectedIds.includes(notification.id));

  function togglePageSelection(checked: boolean) {
    const pageIds = notifications.map((notification) => notification.id);
    setSelectedIds((current) => {
      const outsidePage = current.filter((id) => !pageIds.includes(id));
      return checked ? [...outsidePage, ...pageIds] : outsidePage;
    });
  }

  async function handleDeleteSelected() {
    if (
      selectedIds.length === 0 ||
      !window.confirm(
        `Deseja excluir ${selectedIds.length} notificação(ões) selecionada(s)? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setActionError(null);

    try {
      await notificationService.deleteMany(selectedIds);
      setSelectedIds([]);
      await Promise.all([reload(), reloadUnreadCount()]);

      if (notifications.length === selectedIds.length && page > 1) {
        setPage((current) => current - 1);
      }
    } catch {
      setActionError("Não foi possível excluir as notificações selecionadas.");
    } finally {
      setDeleting(false);
    }
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
              {unreadCount} {unreadCount === 1 ? "aviso não lido" : "avisos não lidos"}
            </span>

            <button
              type="button"
              className={styles.markAllButton}
              onClick={() => void handleMarkAllAsRead()}
              disabled={markingAllAsRead || allRead}
            >
              <CheckCheck />
              {markingAllAsRead ? "Marcando..." : "Marcar todas como lidas"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}

        {loading && (
          <div className={styles.state}>
            <span className={styles.spinner} />
            <p>Carregando avisos...</p>
          </div>
        )}

        {!loading && error != null && (
          <div className={styles.state}>
            <p className={styles.error}>Não foi possível carregar os avisos.</p>
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
            <div className={styles.emptyIcon}><CheckCheck /></div>
            <h2>Nenhum aviso</h2>
            <p>Você não possui avisos registrados no momento.</p>
          </div>
        )}

        {!loading && error == null && notifications.length > 0 && (
          <>
            <div className={styles.bulkActions}>
              <label className={styles.selectPage}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(event) => togglePageSelection(event.target.checked)}
                />
                Selecionar página ({notifications.length})
              </label>

              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => void handleDeleteSelected()}
                disabled={selectedIds.length === 0 || deleting}
              >
                <Trash2 />
                {deleting ? "Excluindo..." : `Excluir selecionadas (${selectedIds.length})`}
              </button>
            </div>

            <div className={styles.list}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  markingAsRead={markingAsRead}
                  onOpen={handleOpen}
                  selectable
                  selected={selectedIds.includes(notification.id)}
                  onSelectionChange={toggleSelection}
                />
              ))}
            </div>

            <nav className={styles.pagination} aria-label="Paginação de notificações">
              <span>
                Página {meta.page} de {Math.max(1, meta.totalPages)} · {meta.total} notificações
              </span>
              <div className={styles.paginationActions}>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    setSelectedIds([]);
                    setPage((current) => Math.max(1, current - 1));
                  }}
                  disabled={page <= 1 || loading}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    setSelectedIds([]);
                    setPage((current) => current + 1);
                  }}
                  disabled={page >= meta.totalPages || loading}
                >
                  Próxima
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
