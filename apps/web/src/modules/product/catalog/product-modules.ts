/**
 * Catálogo central dos módulos disponíveis no CCPF.
 *
 * Responsabilidade:
 * - definir a identidade comercial e funcional de cada módulo;
 * - associar módulos às features do plano quando aplicável;
 * - registrar a rota e o estado de implementação;
 * - servir como fonte única para Sidebar e futuras regras de acesso.
 *
 * Este arquivo NÃO decide se o usuário possui acesso.
 * A decisão de acesso é responsabilidade da camada de resolução.
 */

import type { ComponentType } from "react";

import {
  ArrowLeftRight,
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
   * Indica que o módulo exige Tenant ativo.
   */
  tenantRequired?: boolean;
}

export const productModules: ProductModule[] = [
  {
    code: "DASHBOARD",
    label: "Dashboard",
    section: "Principal",
    icon: LayoutDashboard,
    href: "/dashboard",
    feature: null,
    implemented: true,
    tenantRequired: true,
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
