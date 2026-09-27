"use client";

import type { ChangeEvent } from "react";

import { Select } from "@/components/ui/forms/Select";

import { useTenantStore } from "../../stores";

import styles from "./TenantSelector.module.scss";

// Componente responsável exclusivamente pela seleção do Tenant ativo.
//
// A lista de Tenants e o Tenant atualmente selecionado são obtidos do
// TenantStore. A comunicação com a API permanece no TenantProvider,
// mantendo a separação entre apresentação e infraestrutura.
export function TenantSelector() {
  const tenants = useTenantStore((state) => state.tenants);
  const activeTenantId = useTenantStore(
    (state) => state.activeTenantId,
  );
  const setActiveTenantId = useTenantStore(
    (state) => state.setActiveTenantId,
  );

  // Não renderiza o seletor enquanto o Tenant ainda não estiver disponível.
  if (tenants.length === 0) {
    return null;
  }

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setActiveTenantId(event.target.value);
  }

  return (
    <div className={styles.container}>
      <Select
        value={activeTenantId ?? ""}
        onChange={handleChange}
        aria-label="Selecionar Tenant"
        disabled={tenants.length <= 1}
        fullWidth={false}
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
