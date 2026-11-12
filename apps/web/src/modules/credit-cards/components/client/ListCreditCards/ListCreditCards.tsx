"use client";

import { useState } from "react";

import { CreditCardFormModal } from "@/modules/credit-cards/components/client/CreditCardFormModal";
import { CreditCardPurchaseModal } from "@/modules/credit-cards/components/client/CreditCardPurchaseModal";
import { useCreditCards } from "@/modules/credit-cards/hooks";
import type {
  CreditCard,
  CreditCardBrand,
  CreditCardStatus,
} from "@/modules/credit-cards/types";

import styles from "./ListCreditCards.module.scss";

const BRAND_LABELS: Record<CreditCardBrand, string> = {
  VISA: "Visa",
  MASTERCARD: "Mastercard",
  ELO: "Elo",
  AMEX: "American Express",
  HIPERCARD: "Hipercard",
  OTHER: "Outra",
};

const STATUS_LABELS: Record<CreditCardStatus, string> = {
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
};

function formatCreditLimit(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ListCreditCards() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [purchaseCard, setPurchaseCard] = useState<CreditCard | null>(null);

  const { cards, loading, error, load } = useCreditCards();

  function handleCreate() {
    setSelectedCard(null);
    setFormOpen(true);
  }

  function handleEdit(card: CreditCard) {
    setSelectedCard(card);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setSelectedCard(null);
  }

  function handlePurchase(card: CreditCard) {
    setPurchaseCard(card);
  }

  function handlePurchaseClose() {
    setPurchaseCard(null);
  }

  async function handleSaved() {
    await load();
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando cartões...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>
          <p>Não foi possível carregar os cartões.</p>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Cartões de crédito</h1>
            <p className={styles.description}>
              Gerencie seus cartões e acompanhe os dados utilizados nas faturas.
            </p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.total}>
              {cards.length} cartão{cards.length !== 1 ? "s" : ""}
            </span>

            <button
              type="button"
              className={styles.addButton}
              onClick={handleCreate}
            >
              <span aria-hidden="true">+</span>
              <span>Novo cartão</span>
            </button>
          </div>
        </header>

        {cards.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhum cartão cadastrado</h2>
            <p>
              Cadastre seu primeiro cartão para começar a organizar suas compras
              e faturas.
            </p>
            <button
              type="button"
              className={styles.addButton}
              onClick={handleCreate}
            >
              Novo cartão
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cartão</th>
                  <th>Bandeira</th>
                  <th>Limite</th>
                  <th>Fechamento</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th className={styles.actionsHeader}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <strong className={styles.cardName}>{card.name}</strong>
                      <span className={styles.cardDigits}>
                        {card.lastFourDigits
                          ? `•••• ${card.lastFourDigits}`
                          : "Sem identificação"}
                      </span>
                    </td>

                    <td>{BRAND_LABELS[card.brand] ?? card.brand}</td>

                    <td className={styles.limit}>
                      {formatCreditLimit(card.creditLimit)}
                    </td>

                    <td>Dia {card.closingDay}</td>
                    <td>Dia {card.dueDay}</td>

                    <td>
                      <span
                        className={
                          card.status === "ACTIVE"
                            ? styles.active
                            : styles.archived
                        }
                      >
                        {STATUS_LABELS[card.status] ?? card.status}
                      </span>
                    </td>

                    <td>
                      <div className={styles.actions}>
                        {card.status === "ACTIVE" && (
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => handlePurchase(card)}
                            aria-label={`Nova compra no cartão ${card.name}`}
                            title="Registrar compra"
                          >
                            Nova compra
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => handleEdit(card)}
                          aria-label={`Editar cartão ${card.name}`}
                          title="Editar cartão"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreditCardPurchaseModal
        open={purchaseCard !== null}
        card={purchaseCard}
        onClose={handlePurchaseClose}
        onSaved={async () => {
          await load();
        }}
      />

      <CreditCardFormModal
        open={formOpen}
        card={selectedCard}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </>
  );
}
