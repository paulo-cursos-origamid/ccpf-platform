/**
 * Catálogo central dos módulos disponíveis no CCPF.
 *
 * Responsabilidade:
 * - definir a identidade funcional de cada módulo;
 * - associar módulos às features comerciais quando aplicável;
 * - registrar a rota e o estado de implementação;
 * - declarar requisitos estruturais de acesso;
 * - servir como fonte única para a navegação do Sidebar.
 *
 * Este arquivo NÃO decide se o usuário possui acesso.
 * A decisão de acesso é responsabilidade da camada de resolução.
 */

import type { ComponentType } from "react";

import {
  ArrowLeftRight,
  Bell,
  BusFront,
  Car,
  Ellipsis,
  FileChartColumn,
  HeartPulse,
  LayoutDashboard,
  Receipt,
  Settings,
  Tags,
  Users,
  Wallet,
} from "@/components/icons";

import type { PlanFeatureCode } from "@/modules/billing";

export type ProductModuleCode =
  | "DASHBOARD"
  | "ACCOUNTS"
  | "CATEGORIES"
  | "TRANSACTIONS"
  | "REPORTS"
  | "VEHICLES"
  | "HEALTH"
  | "TRANSPORT"
  | "INVESTMENTS"
  | "OTHER"
  | "USERS"
  | "BILLING"
  | "NOTIFICATIONS"
  | "SETTINGS";

export type ProductModuleSection =
  | "Principal"
  | "Financeiro"
  | "Domínios"
  | "Administração"
  | "Configurações";

export interface ProductModule {
  code: ProductModuleCode;
  label: string;
  section: ProductModuleSection;
  icon: ComponentType<{ size?: number }>;
  href: string;

  /**
   * Feature comercial exigida pelo plano.
   *
   * Quando null, o módulo não depende de uma feature
   * específica do plano.
   */
  feature: PlanFeatureCode | null;

  /**
   * Indica se a rota correspondente já está implementada
   * no frontend.
   */
  implemented: boolean;

  /**
   * Restrição exclusiva da plataforma.
   *
   * Não representa uma feature comercial do plano.
   */
  adminOnly?: boolean;

  /**
   * Indica que o módulo exige um Tenant ativo.
   *
   * Módulos administrativos da plataforma e o Dashboard
   * compartilhado não dependem desse requisito.
   */
  tenantRequired?: boolean;
}

export const productModules: ProductModule[] = [
  /**
   * Dashboard compartilhado.
   *
   * A própria página decide o conteúdo exibido:
   * - Platform Admin com DASHBOARD_READ -> AdminDashboard;
   * - usuário de Tenant -> TenantDashboard.
   *
   * Por isso, o módulo não exige Tenant no catálogo.
   */
  {
    code: "DASHBOARD",
    label: "Dashboard",
    section: "Principal",
    icon: LayoutDashboard,
    href: "/dashboard",
    feature: null,
    implemented: true,
  },

  {
    code: "ACCOUNTS",
    label: "Contas",
    section: "Financeiro",
    icon: Wallet,
    href: "/dashboard/accounts",
    feature: null,
    implemented: true,
    tenantRequired: true,
  },

  {
    code: "CATEGORIES",
    label: "Categorias",
    section: "Financeiro",
    icon: Tags,
    href: "/dashboard/categories",
    feature: "DOMESTIC",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "TRANSACTIONS",
    label: "Transações",
    section: "Financeiro",
    icon: ArrowLeftRight,
    href: "/dashboard/transactions",
    feature: "DOMESTIC",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "REPORTS",
    label: "Relatórios",
    section: "Financeiro",
    icon: FileChartColumn,
    href: "/dashboard/reports",
    feature: "BASIC_REPORTS",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "VEHICLES",
    label: "Veículos",
    section: "Domínios",
    icon: Car,
    href: "/dashboard/vehicles",
    feature: "VEHICLES",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "HEALTH",
    label: "Saúde",
    section: "Domínios",
    icon: HeartPulse,
    href: "/dashboard/health",
    feature: "HEALTH",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "TRANSPORT",
    label: "Transportes",
    section: "Domínios",
    icon: BusFront,
    href: "/dashboard/transport",
    feature: "TRANSPORT",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "INVESTMENTS",
    label: "Investimentos",
    section: "Domínios",
    icon: Settings,
    href: "/dashboard/investments",
    feature: "INVESTMENTS",
    implemented: false,
    tenantRequired: true,
  },

  {
    code: "OTHER",
    label: "Outros",
    section: "Domínios",
    icon: Ellipsis,
    href: "/dashboard/other",
    feature: "OTHER",
    implemented: false,
    tenantRequired: true,
  },

  /**
   * Administração da plataforma.
   *
   * Esses módulos não pertencem ao contexto financeiro
   * de um Tenant e não dependem de feature comercial.
   */
  {
    code: "USERS",
    label: "Usuários",
    section: "Administração",
    icon: Users,
    href: "/dashboard/users",
    feature: null,
    implemented: true,
    adminOnly: true,
  },

  {
    code: "BILLING",
    label: "Faturamento",
    section: "Administração",
    icon: Receipt,
    href: "/admin/billing/invoices",
    feature: null,
    implemented: true,
    adminOnly: true,
  },

  {
    code: "NOTIFICATIONS",
    label: "Notificações",
    section: "Administração",
    icon: Bell,
    href: "/admin/notifications",
    feature: null,
    implemented: true,
    adminOnly: true,
  },

  /**
   * Configurações pertencem ao Tenant ativo.
   */
  {
    code: "SETTINGS",
    label: "Configurações",
    section: "Configurações",
    icon: Settings,
    href: "/settings",
    feature: null,
    implemented: true,
    tenantRequired: true,
  },
];
