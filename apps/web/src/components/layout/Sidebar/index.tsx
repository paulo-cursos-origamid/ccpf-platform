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

import { useIdentityStore } from "@/modules/identity/stores/identity.store";
import { useTenantStore } from "@/modules/tenant/stores";

import styles from "./Sidebar.module.scss";

interface MenuItem {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  adminOnly?: boolean;
  tenantRequired?: boolean;
}

// Define os itens disponíveis na navegação principal da aplicação.
//
// tenantRequired indica que a funcionalidade pertence ao contexto
// do Tenant atualmente selecionado.
const menu: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    tenantRequired: true,
  },
  {
    label: "Contas",
    icon: Wallet,
    href: "/dashboard/accounts",
    tenantRequired: true,
  },
  {
    label: "Categorias",
    icon: Tags,
    href: "/dashboard/categories",
    tenantRequired: true,
  },
  {
    label: "Transações",
    icon: ArrowLeftRight,
    href: "/dashboard/transactions",
    tenantRequired: true,
  },
  {
    label: "Relatórios",
    icon: FileChartColumn,
    href: "/dashboard/reports",
    tenantRequired: true,
  },
  {
    label: "Veículos",
    icon: Car,
    href: "/dashboard/vehicles",
    tenantRequired: true,
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

  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const isAdmin = user?.role === "ADMIN";

  const visibleMenu = menu.filter((item) => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }

    if (item.tenantRequired && !activeTenantId) {
      return false;
    }

    return true;
  });

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {visibleMenu.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href} className={styles.item}>
              <span className={styles.icon}>
                <Icon size={20} />
              </span>

              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
