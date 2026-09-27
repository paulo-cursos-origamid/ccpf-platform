/**
 * Meios de pagamento aceitos pelo Billing do CCPF.
 *
 * O nome técnico permanece em inglês para manter o domínio
 * consistente com os demais enums da aplicação.
 *
 * A apresentação pode traduzir:
 * - PIX -> Pix
 * - BANK_SLIP -> Boleto
 */
export enum PaymentMethod {
  PIX = 'PIX',
  BANK_SLIP = 'BANK_SLIP',
}
