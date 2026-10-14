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
  onOpen?: (notification: Notification) => Promise<void>;
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (notificationId: string, selected: boolean) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function SeverityIcon({ severity }: { severity: Notification["severity"] }) {
  if (severity === "SUCCESS") return <CheckCircle />;
  if (severity === "WARNING") return <AlertTriangle />;
  if (severity === "ERROR") return <AlertCircle />;
  return <Info />;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  markingAsRead = false,
  onOpen,
  selectable = false,
  selected = false,
  onSelectionChange,
}: NotificationItemProps) {
  const unread = notification.readAt === null;

  return (
    <article
      className={`${styles.item} ${unread ? styles.unread : ""}`}
      data-severity={notification.severity.toLowerCase()}
    >
      {selectable && (
        <input
          className={styles.selection}
          type="checkbox"
          checked={selected}
          onChange={(event) =>
            onSelectionChange?.(notification.id, event.target.checked)
          }
          aria-label={`Selecionar ${notification.title}`}
        />
      )}

      <div className={styles.icon}>
        <SeverityIcon severity={notification.severity} />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          {onOpen ? (
            <button
              type="button"
              className={styles.titleButton}
              onClick={() => void onOpen(notification)}
            >
              {notification.title}
            </button>
          ) : (
            <h3 className={styles.title}>{notification.title}</h3>
          )}

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
              onClick={() => void onMarkAsRead(notification.id)}
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
