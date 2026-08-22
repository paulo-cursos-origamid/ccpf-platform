"use client";

import Link from "next/link";

import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  FileChartColumn,
  Car,
  Settings,
  Users,
} from "@/components/icons";


import styles from "./Sidebar.module.scss";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";

const menu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Contas",
    icon: Wallet,
    href: "/accounts",
  },
  {
    label: "Categorias",
    icon: Tags,
    href: "/categories",
  },
  {
    label: "Transações",
    icon: ArrowLeftRight,
    href: "/transactions",
  },
  {
    label: "Relatórios",
    icon: FileChartColumn,
    href: "/reports",
  },
  {
    label: "Veículos",
    icon: Car,
    href: "/vehicles",
  },
  {
    label: "Usuários",
    icon: Users,
    href: "/dashboard/users",
    adminOnly: true,
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar() {
  const user = useIdentityStore((state) => state.user);

  const isAdmin = user?.role === "ADMIN";

  const visibleMenu = menu.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {visibleMenu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={styles.item}
            >
              <span className={styles.icon}>
                <Icon size={20} />
              </span>

              <span className={styles.label}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}