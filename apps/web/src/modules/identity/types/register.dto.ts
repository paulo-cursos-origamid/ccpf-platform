/**
 * Dados enviados pelo cadastro público.
 *
 * planPriceId é opcional porque o plano TRIAL não possui
 * modalidade comercial. Para planos pagos, o formulário
 * deve enviar o identificador da modalidade escolhida.
 */
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  planCode: string;
  planPriceId?: string;
  billingDay?: number;
  installmentCount?: 1 | 2 | 3 | 6 | 12;
}
