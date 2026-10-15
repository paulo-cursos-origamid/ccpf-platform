"use client";

import type { ChangeEvent } from "react";

import { Select } from "@/components/ui/forms/Select";

import { useTenantStore } from "../../stores";

import styles from "./TenantSelector.module.scss";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

/**
 * Permite selecionar o espaço ativo e visualizar o papel do usuário
 * em cada espaço. A autorização continua sendo responsabilidade da API.
 */
export function TenantSelector() {
  const tenants = useTenantStore((state) => state.tenants);
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const loading = useTenantStore((state) => state.loading);
  const setActiveTenantId = useTenantStore(
    (state) => state.setActiveTenantId,
  );

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setActiveTenantId(event.target.value);
  }

  if (loading && tenants.length === 0) {
    return (
      <div className={styles.container}>
        <Select
          value=""
          onChange={() => undefined}
          aria-label="Carregando espaços"
          disabled
          fullWidth={false}
        >
          <option value="">Carregando espaços...</option>
        </Select>
      </div>
    );
  }

  if (tenants.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Select
        value={activeTenantId ?? ""}
        onChange={handleChange}
        aria-label="Selecionar espaço"
        disabled={loading || tenants.length <= 1}
        fullWidth={false}
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} — {ROLE_LABELS[tenant.role] ?? tenant.role}
          </option>
        ))}
      </Select>
    </div>
  );
}
