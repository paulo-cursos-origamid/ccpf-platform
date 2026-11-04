import { FinancialGoalEntity } from './financial-goal.entity';
import { FinancialGoalStatus } from '../enums/financial-goal-status.enum';

describe('FinancialGoalEntity', () => {
  const createGoal = (
    overrides: Partial<
      ConstructorParameters<typeof FinancialGoalEntity>[0]
    > = {},
  ) =>
    new FinancialGoalEntity({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Viagem',
      targetAmount: 10000,
      ...overrides,
    });

  it('deve criar uma meta ativa', () => {
    const goal = createGoal();

    expect(goal.name).toBe('Viagem');
    expect(goal.status).toBe(FinancialGoalStatus.ACTIVE);
    expect(goal.deletedAt).toBeNull();
  });

  it('deve normalizar nome e descrição', () => {
    const goal = createGoal({
      name: '  Viagem  ',
      description: '  Minha viagem  ',
    });

    expect(goal.name).toBe('Viagem');
    expect(goal.description).toBe('Minha viagem');
  });

  it('deve rejeitar nome inválido', () => {
    expect(() => createGoal({ name: 'A' })).toThrow();
  });

  it('deve rejeitar valor-alvo menor ou igual a zero', () => {
    expect(() => createGoal({ targetAmount: 0 })).toThrow();
    expect(() => createGoal({ targetAmount: -100 })).toThrow();
  });

  it('deve rejeitar data inválida', () => {
    expect(() =>
      createGoal({ targetDate: new Date('data-inválida') }),
    ).toThrow();
  });

  it('deve atualizar os dados de uma meta ativa', () => {
    const goal = createGoal();

    goal.updateDetails({
      name: 'Reserva de emergência',
      description: 'Segurança financeira',
      linkedAccountId: 'account-1',
      targetAmount: 20000,
      targetDate: new Date('2027-12-31'),
    });

    expect(goal.name).toBe('Reserva de emergência');
    expect(goal.description).toBe('Segurança financeira');
    expect(goal.linkedAccountId).toBe('account-1');
    expect(goal.targetAmount).toBe(20000);
    expect(goal.targetDate).toEqual(new Date('2027-12-31'));
  });

  it('deve arquivar sem preencher deletedAt', () => {
    const goal = createGoal();

    goal.archive();

    expect(goal.status).toBe(FinancialGoalStatus.ARCHIVED);
    expect(goal.deletedAt).toBeNull();
  });

  it('não deve permitir arquivar uma meta duas vezes', () => {
    const goal = createGoal();

    goal.archive();

    expect(() => goal.archive()).toThrow();
  });

  it('deve restaurar uma meta arquivada', () => {
    const goal = createGoal({ status: FinancialGoalStatus.ARCHIVED });

    goal.restore();

    expect(goal.status).toBe(FinancialGoalStatus.ACTIVE);
  });

  it('não deve permitir restaurar uma meta não arquivada', () => {
    const goal = createGoal();

    expect(() => goal.restore()).toThrow();
  });

  it('não deve permitir atualizar uma meta arquivada', () => {
    const goal = createGoal();

    goal.archive();

    expect(() =>
      goal.updateDetails({
        name: 'Nova meta',
        targetAmount: 20000,
      }),
    ).toThrow();
  });

  it('não deve permitir contribuições em uma meta arquivada', () => {
    const goal = createGoal();

    goal.archive();

    expect(() => goal.ensureCanReceiveContributions()).toThrow();
  });
});
