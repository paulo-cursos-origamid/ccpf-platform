"use client";

import { useState } from "react";

import { CreditCardFormModal } from "../CreditCardFormModal";
import { creditCardsService } from "../../../services/credit-cards.service";
import type { CreditCard } from "../../../types";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCreditCardDashboard } from "../../../hooks/client/useCreditCardDashboard";
import styles from "./CreditCardDashboard.module.scss";

const currency = (value: string | number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const monthLabel = (value: string) => {
  const referenceMonth = value.slice(0, 7);
  const date = new Date(`${referenceMonth}-01T12:00:00`);

  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
};

const dateLabel = (value: string) => {
  const calendarDate = value.slice(0, 10);
  const date = new Date(`${calendarDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR");
};

export function CreditCardDashboard() {
  const { dashboard, loading, error, load } = useCreditCardDashboard();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editError, setEditError] = useState(false);

  function handleCreate() {
    setSelectedCard(null);
    setEditError(false);
    setFormOpen(true);
  }

  async function handleEdit(cardId: string) {
    setEditingCardId(cardId);
    setEditError(false);

    try {
      const card = await creditCardsService.get(cardId);
      setSelectedCard(card);
      setFormOpen(true);
    } catch {
      setEditError(true);
    } finally {
      setEditingCardId(null);
    }
  }

  function handleClose() {
    setFormOpen(false);
    setSelectedCard(null);
  }

  if (loading) {
    return <section className={styles.state}>Carregando dashboard de cartões...</section>;
  }

  if (error || !dashboard) {
    return (
      <section className={styles.state}>
        <p>Não foi possível carregar o dashboard de cartões.</p>
        <button onClick={() => void load()}>Tentar novamente</button>
      </section>
    );
  }

  const { summary, monthlyExpenses, cards, upcomingInvoices } = dashboard;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Dashboard de cartões</h1>
          <p>Acompanhe limites, compromissos e faturas.</p>
        </div>
        <button
          type="button"
          className={styles.newCardButton}
          onClick={handleCreate}
        >
          <span aria-hidden="true">+</span>
          Novo cartão
        </button>
      </header>

      <section className={styles.metrics}>
        <article className={styles.metric}>
          <span>Limite total</span>
          <strong>{currency(summary.totalLimit)}</strong>
        </article>

        <article className={styles.metric}>
          <span>Limite comprometido</span>
          <strong>{currency(summary.committedLimit)}</strong>
        </article>

        <article className={styles.metric}>
          <span>Limite disponível</span>
          <strong>{currency(summary.availableLimit)}</strong>
        </article>

        <article className={styles.metric}>
          <span>Faturas em aberto</span>
          <strong>{summary.openInvoiceCount}</strong>
          <small>{currency(summary.openInvoiceAmount)} pendentes</small>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>Despesas por mês</h2>
          <span>Últimos 12 meses</span>
        </div>

        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyExpenses.map((item) => ({
                month: monthLabel(item.referenceMonth),
                total: Number(item.totalAmount),
              }))}
              margin={{ top: 12, right: 12, left: 12, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value: number) =>
                  value.toLocaleString("pt-BR", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  })
                }
              />
              <Tooltip
                formatter={(value) => [currency(Number(value)), "Despesas"]}
              />
              <Bar dataKey="total" name="Despesas" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>Meus cartões</h2>
          <span>{cards.length} cartões ativos</span>
        </div>

        {editError && (
          <p className={styles.empty}>
            Não foi possível carregar os dados completos do cartão para edição.
          </p>
        )}

        {cards.length === 0 ? (
          <p className={styles.empty}>Nenhum cartão ativo cadastrado.</p>
        ) : (
          <div className={styles.cardGrid}>
            {cards.map((card) => (
              <article className={styles.creditCard} key={card.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <strong>{card.name}</strong>
                    <span>
                      {card.brand}
                      {card.lastFourDigits ? ` •••• ${card.lastFourDigits}` : ""}
                    </span>
                  </div>
                  <span className={styles.cardLimit}>
                    {currency(card.creditLimit)}
                  </span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      onClick={() => void handleEdit(card.id)}
                      disabled={editingCardId !== null}
                    >
                      {editingCardId === card.id ? "Carregando..." : "Editar"}
                    </button>
                  </div>
                </div>

                <div className={styles.cardValues}>
                  <div>
                    <span>Comprometido</span>
                    <strong>{currency(card.committedAmount)}</strong>
                  </div>
                  <div>
                    <span>Disponível</span>
                    <strong>{currency(card.availableLimit)}</strong>
                  </div>
                </div>

                {card.nextInvoice && (
                  <div className={styles.nextInvoice}>
                    <span>Próxima fatura</span>
                    <strong>
                      {currency(card.nextInvoice.remainingAmount)}
                    </strong>
                    <small>
                      Vencimento: {dateLabel(card.nextInvoice.dueDate)}
                    </small>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>Próximas faturas</h2>
          <span>{upcomingInvoices.length} faturas</span>
        </div>

        {upcomingInvoices.length === 0 ? (
          <p className={styles.empty}>Nenhuma fatura em aberto.</p>
        ) : (
          <div className={styles.invoiceList}>
            {upcomingInvoices.map((invoice) => (
              <article className={styles.invoice} key={invoice.id}>
                <div>
                  <strong>{invoice.creditCard.name}</strong>
                  <span>
                    Vencimento: {dateLabel(invoice.dueDate)}
                  </span>
                </div>
                <strong>{currency(invoice.remainingAmount)}</strong>
              </article>
            ))}
          </div>
        )}
      </section>
      <CreditCardFormModal
        open={formOpen}
        card={selectedCard}
        onClose={handleClose}
        onSaved={async () => {
          await load();
        }}
      />
    </div>
  );
}
