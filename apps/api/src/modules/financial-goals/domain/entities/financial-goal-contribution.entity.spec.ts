import { FinancialGoalContributionEntity } from './financial-goal-contribution.entity';

describe('FinancialGoalContributionEntity', () => {
  const createContribution = (
    overrides: Partial<
      ConstructorParameters<typeof FinancialGoalContributionEntity>[0]
    > = {},
  ) =>
    new FinancialGoalContributionEntity({
      tenantId: 'tenant-1',
      goalId: 'goal-1',
      userId: 'user-1',
      amount: 500,
      ...overrides,
    });

  it('deve criar um aporte válido', () => {
    const contribution = createContribution();

    expect(contribution.amount).toBe(500);
    expect(contribution.tenantId).toBe('tenant-1');
    expect(contribution.goalId).toBe('goal-1');
    expect(contribution.deletedAt).toBeNull();
  });

  it('deve rejeitar valor menor ou igual a zero', () => {
    expect(() => createContribution({ amount: 0 })).toThrow();
    expect(() => createContribution({ amount: -10 })).toThrow();
  });

  it('deve rejeitar valor não numérico', () => {
    expect(() => createContribution({ amount: Number.NaN })).toThrow();
    expect(() => createContribution({ amount: Infinity })).toThrow();
  });

  it('deve rejeitar data inválida', () => {
    expect(
      () => createContribution({ date: new Date('data-inválida') }),
    ).toThrow();
  });

  it('deve normalizar a descrição', () => {
    const contribution = createContribution({
      description: '  Aporte mensal  ',
    });

    expect(contribution.description).toBe('Aporte mensal');
  });

  it('deve aceitar descrição vazia como null', () => {
    const contribution = createContribution({ description: '   ' });

    expect(contribution.description).toBeNull();
  });
});
