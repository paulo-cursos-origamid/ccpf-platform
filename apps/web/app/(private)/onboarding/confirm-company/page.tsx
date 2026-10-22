"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { tenantService } from "@/modules/tenant/services";
import { useTenantStore } from "@/modules/tenant/stores";
import styles from "./page.module.scss";

export default function ConfirmCompanyPage() {
  const router = useRouter();
  const tenants = useTenantStore((state) => state.tenants);
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const setTenants = useTenantStore((state) => state.setTenants);
  const tenant = tenants.find((item) => item.id === activeTenantId) ?? null;

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    if (tenant.nameConfirmed) router.replace("/dashboard");
  }, [tenant, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 120) {
      setError("Informe um nome entre 2 e 120 caracteres.");
      return;
    }
    if (!tenant) {
      setError("Não encontramos uma empresa ativa. Atualize a página e tente novamente.");
      return;
    }

    setSubmitting(true);
    try {
      await tenantService.confirmName(normalizedName);
      setTenants(tenants.map((item) =>
        item.id === tenant.id
          ? { ...item, name: normalizedName, nameConfirmed: true }
          : item,
      ));
      router.replace("/dashboard");
    } catch {
      setError("Não foi possível confirmar o nome. Verifique sua conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.brandMark} aria-hidden="true">
          <Building2 size={27} strokeWidth={1.8} />
        </div>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          CONFIGURAÇÃO DA CONTA
        </div>
        <h1>Confirme o nome da sua empresa</h1>
        <p className={styles.description}>
          Confirme como sua empresa será identificada no CCPF Platform.
          Você poderá continuar assim que salvar esse nome.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="company-name">Nome da empresa</label>
          <input
            id="company-name"
            name="companyName"
            autoComplete="organization"
            maxLength={120}
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Minha Empresa Ltda."
            required
            disabled={submitting}
          />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={submitting || name.trim().length < 2}>
            {submitting
              ? <><LoaderCircle size={18} className={styles.spinner} /> Confirmando...</>
              : <>Confirmar e continuar <CheckCircle2 size={18} /></>}
          </button>
        </form>

        <div className={styles.privacyNote}>
          <ShieldCheck size={17} />
          <span>Seus dados são tratados com segurança.</span>
        </div>
      </section>
      <footer className={styles.footer}>
        CCPF Platform <span>·</span> Seu negócio, organizado em um só lugar.
      </footer>
    </main>
  );
}
