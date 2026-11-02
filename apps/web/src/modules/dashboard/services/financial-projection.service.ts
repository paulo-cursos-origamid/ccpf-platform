import { api } from '@/lib/api/client';
import type { FinancialProjection } from '../types/financial-projection.types';

export const financialProjectionService = {
  get(): Promise<FinancialProjection> {
    return api.get<FinancialProjection>('/transactions/financial-projection');
  },
};
