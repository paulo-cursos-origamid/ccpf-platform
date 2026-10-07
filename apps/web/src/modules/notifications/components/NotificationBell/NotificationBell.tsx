"use client";

import { useState } from "react";

import { Bell } from "@/components/icons";

import { useUnreadNotificationCount } from "../../hooks";
import { NotificationDropdown } from "../NotificationDropdown";

import styles from "./NotificationBell.module.scss";

/**
 * Componente responsável pelo sino de notificações do Header.
 *
 * Consulta a quantidade de notificações não lidas no backend,
 * apresenta o contador e controla a abertura da Central de Avisos.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { count, reload } = useUnreadNotificationCount();

  function handleToggle() {
    setOpen((current) => !current);

    if (!open) {
      void reload();
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        aria-label={
          count > 0
            ? `Notificações: ${count} não ${
                count === 1 ? "lida" : "lidas"
              }`
            : "Notificações"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleToggle}
      >
        <Bell />

        {count > 0 && (
          <span className={styles.badge} aria-label={`${count} não lidas`}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      <NotificationDropdown
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
