"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Menu,
  X,
} from "@/components/icons";

import { SubscriptionSummary, useTenantSubscription } from "@/modules/billing";
import { ComingSoonFeedback } from "@/components/ui";
import { resolveModuleAccess } from "@/modules/product/access";
import {
  productModules,
  type ProductModuleAccess,
  type ProductModuleSection,
} from "@/modules/product/catalog";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";
import { useTenantStore } from "@/modules/tenant/stores";

import styles from "./Sidebar.module.scss";

interface VisibleModule {
  code: string;
  label: string;
  href: string;
  icon: typeof productModules[number]["icon"];
  access: ProductModuleAccess;
}

interface VisibleSection {
  label: ProductModuleSection;
  items: VisibleModule[];
}

/**
 * Estados que não devem ser exibidos no menu lateral.
 *
 * O Sidebar é responsável somente pela apresentação.
 * A regra que determina o estado pertence ao resolver.
 */
const HIDDEN_ACCESS_STATES: ProductModuleAccess[] = [
  "NOT_INCLUDED",
  "NO_COMMERCIAL_ACCESS",
  "ADMIN_ONLY",
  "NO_TENANT",
];

export function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [comingSoonModule, setComingSoonModule] = useState<string | null>(
    null,
  );

  const user = useIdentityStore((state) => state.user);
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const subscription = useTenantSubscription();

  const isPlatformAdmin = user?.role === "ADMIN";

  /**
   * Resolve a visibilidade e o estado de cada módulo
   * usando o catálogo central do produto.
   */
  const visibleSections: VisibleSection[] = productModules
    .map((module) => ({
      module,
      access: resolveModuleAccess(module, {
        subscription,
        hasActiveTenant: Boolean(activeTenantId),
        isPlatformAdmin,
      }),
    }))
    .filter(({ access }) => !HIDDEN_ACCESS_STATES.includes(access))
    .reduce<VisibleSection[]>((sections, { module, access }) => {
      const section = sections.find(
        (item) => item.label === module.section,
      );

      const visibleModule: VisibleModule = {
        code: module.code,
        label: module.label,
        href: module.href,
        icon: module.icon,
        access,
      };

      if (section) {
        section.items.push(visibleModule);
      } else {
        sections.push({
          label: module.section,
          items: [visibleModule],
        });
      }

      return sections;
    }, []);

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  function handleComingSoonClick(moduleName: string) {
    setComingSoonModule(moduleName);
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.logo}>
            CCPF
          </span>
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
                const comingSoon = item.access === "COMING_SOON";

                if (comingSoon) {
                  return (
                    <button
                      key={item.code}
                      type="button"
                      className={styles.item}
                      title={`${item.label} — Em desenvolvimento`}
                      aria-label={`${item.label} — funcionalidade em desenvolvimento`}
                      onClick={() => handleComingSoonClick(item.label)}
                    >
                      <span className={styles.icon}>
                        <Icon size={20} />
                      </span>

                      <span className={styles.label}>
                        {item.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.code}
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

      <ComingSoonFeedback
        moduleName={comingSoonModule}
        onClose={() => setComingSoonModule(null)}
      />
    </aside>
  );
}
