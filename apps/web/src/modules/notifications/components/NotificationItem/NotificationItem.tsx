"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
} from "@/components/icons";

import type { Notification } from "../../types";

import styles from "./NotificationItem.module.scss";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => Promise<void>;
  markingAsRead?: boolean;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function SeverityIcon({
  severity,
}: {
  severity: Notification["severity"];
}) {
  if (severity === "SUCCESS") {
    return <CheckCircle />;
  }

  if (severity === "WARNING") {
    return <AlertTriangle />;
  }

  if (severity === "ERROR") {
    return <AlertCircle />;
  }

  return <Info />;
}

/**
 * Representa visualmente uma notificação individual.
 *
 * Notificações não lidas recebem destaque visual e podem ser
 * marcadas como lidas diretamente pelo usuário.
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  markingAsRead = false,
}: NotificationItemProps) {
  const unread = notification.readAt === null;

  return (
    <article
      className={`${styles.item} ${unread ? styles.unread : ""}`}
      data-severity={notification.severity.toLowerCase()}
    >
      <div className={styles.icon}>
        <SeverityIcon severity={notification.severity} />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{notification.title}</h3>

          {unread && <span className={styles.dot} aria-label="Não lida" />}
        </div>

        <p className={styles.message}>{notification.message}</p>

        <div className={styles.footer}>
          <time dateTime={notification.createdAt}>
            {formatDate(notification.createdAt)}
          </time>

          {unread && (
            <button
              type="button"
              className={styles.readButton}
              onClick={() => onMarkAsRead(notification.id)}
              disabled={markingAsRead}
            >
              {markingAsRead ? "Marcando..." : "Marcar como lida"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
