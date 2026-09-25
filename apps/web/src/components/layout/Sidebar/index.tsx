"use client";

import { useState } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  ArrowLeftRight,
  Car,
  FileChartColumn,
  LayoutDashboard,
  Menu,
  Settings,
  Tags,
  Users,
  Wallet,
  X,
} from "@/components/icons";

import { SubscriptionSummary } from "@/modules/billing";

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

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Principal",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        tenantRequired: true,
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
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
    ],
  },
  {
    label: "Domínios",
    items: [
      {
        label: "Veículos",
        icon: Car,
        href: "/dashboard/vehicles",
        tenantRequired: true,
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        label: "Usuários",
        icon: Users,
        href: "/dashboard/users",
        adminOnly: true,
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        label: "Configurações",
        icon: Settings,
        href: "/settings",
        tenantRequired: true,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  const user = useIdentityStore((state) => state.user);

  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const isPlatformAdmin = user?.role === "ADMIN";

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.adminOnly && !isPlatformAdmin) {
          return false;
        }

        if (item.tenantRequired && !activeTenantId) {
          return false;
        }

        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.logo} />
        </div>

        <button
          type="button"
          className={styles.toggleButton}
          onClick={toggleSidebar}
          aria-label={
            collapsed ? "Abrir menu lateral" : "Fechar menu lateral"
          }
          title={
            collapsed ? "Abrir menu lateral" : "Fechar menu lateral"
          }
        >
          <span
            className={`${styles.toggleIcon} ${
              collapsed ? styles.toggleIconCollapsed : ""
            }`}
            aria-hidden="true"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </span>
        </button>
      </div>

      <nav
        className={styles.nav}
        aria-label="Navegação principal"
      >
        {visibleSections.map((section) => (
          <section
            key={section.label}
            className={styles.section}
          >
            <h2 className={styles.sectionTitle}>
              {section.label}
            </h2>

            <div className={styles.sectionItems}>
              {section.items.map((item) => {
                const Icon = item.icon;

                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.item} ${
                      active ? styles.active : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
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
            </div>
          </section>
        ))}
      </nav>

      <div className={styles.subscription}>
        <SubscriptionSummary collapsed={collapsed} />
      </div>
    </aside>
  );
}