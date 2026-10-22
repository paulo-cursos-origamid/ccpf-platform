"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";

import { Select } from "@/components/ui/forms/Select";

import { useTenantStore } from "../../stores";

import { CreateTenantModal } from "./CreateTenantModal";
import styles from "./TenantSelector.module.scss";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

/**
 * Permite selecionar o espaço ativo.
 * A autorização continua sendo responsabilidade da API.
 */
export function TenantSelector() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const tenants = useTenantStore((state) => state.tenants);
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const loading = useTenantStore((state) => state.loading);
  const setActiveTenantId = useTenantStore(
    (state) => state.setActiveTenantId,
  );

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    setActiveTenantId(event.target.value);
  }

  return (
    <div className={styles.container}>
      {loading && tenants.length === 0 ? (
        <Select
          value=""
          onChange={() => undefined}
          aria-label="Carregando espaços"
          disabled
          fullWidth={false}
        >
          <option value="">Carregando espaços...</option>
        </Select>
      ) : tenants.length > 0 ? (
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
      ) : (
        <span className={styles.empty}>Nenhum espaço cadastrado</span>
      )}

      <CreateTenantModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
