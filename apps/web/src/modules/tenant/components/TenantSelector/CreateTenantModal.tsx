"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Modal } from "@/components/ui/overlay/Modal";

import { tenantService } from "../../services/tenant.service";
import { useTenantStore } from "../../stores";

import styles from "./CreateTenantModal.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function CreateTenantModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTenants = useTenantStore((state) => state.setTenants);
  const setActiveTenantId = useTenantStore(
    (state) => state.setActiveTenantId,
  );

  function close() {
    if (loading) return;
    setName("");
    setError(null);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedName = name.trim();
    const slug = createSlug(normalizedName);

    if (normalizedName.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (slug.length < 2) {
      setError("Não foi possível gerar um identificador válido para esse nome.");
      return;
    }

    setLoading(true);

    try {
      await tenantService.createTenant({ name: normalizedName, slug });
      const tenants = await tenantService.listMine();
      setTenants(tenants);

      const createdTenant = tenants.find((tenant) => tenant.slug === slug);

      if (!createdTenant) {
        throw new Error(
          "O espaço foi criado, mas não apareceu na lista. Atualize a página para conferir.",
        );
      }

      setActiveTenantId(createdTenant.id);
      setName("");
      setError(null);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o espaço.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Criar espaço"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Crie um espaço para organizar seus dados. Você será o proprietário
          desse espaço.
        </p>

        <label className={styles.label} htmlFor="new-tenant-name">
          Nome do espaço
        </label>
        <input
          id="new-tenant-name"
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Minha Empresa"
          minLength={2}
          maxLength={100}
          autoComplete="organization"
          required
          autoFocus
          disabled={loading}
        />

        <p className={styles.slug}>
          Identificador: <strong>{createSlug(name) || "nome-do-espaco"}</strong>
        </p>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.cancel}
            type="button"
            onClick={close}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={styles.submit}
            type="submit"
            disabled={loading || name.trim().length < 2}
          >
            {loading ? "Criando..." : "Criar espaço"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
