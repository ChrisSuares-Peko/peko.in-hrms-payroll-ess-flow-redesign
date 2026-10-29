const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { updateEnachMandateExecutionStatus } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

const makeMockExecution = (overrides = {}) => ({
  id: 1,
  execution_reference_id: 'EXEC-REF-001',
  decentro_txn_id: null,
  status: 'PENDING',
  amount: 1000,
  corporateUser: 'user-1',
  createdAt: new Date('2024-01-01'),
  processed_or_failed_at: null,
  successOrFailDate: null,
  toJSON: jest.fn(function () { return { ...this }; }),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('updateEnachMandateExecutionStatus', () => {
  it('throws when both execution_reference_id and decentro_txn_id are missing', async () => {
    await expect(
      updateEnachMandateExecutionStatus({ status: 'SUCCESS' })
    ).rejects.toThrow('Either execution_reference_id or decentro_txn_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updateEnachMandateExecutionStatus({ execution_reference_id: 'EXEC-REF-001', status: '' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no execution is found by either identifier', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    await expect(
      updateEnachMandateExecutionStatus({ execution_reference_id: 'EXEC-NONE', status: 'SUCCESS' })
    ).rejects.toThrow('No eNACH execution found');
  });

  it('finds execution by execution_reference_id when provided', async () => {
    const execution = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(execution);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: { execution_reference_id: 'EXEC-REF-001' },
    });
  });

  it('falls back to decentro_txn_id lookup when execution_reference_id not found', async () => {
    const execution = makeMockExecution({ decentro_txn_id: 'DTX-001' });
    EnachMandateExecution.findOne.mockResolvedValue(execution);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      decentro_txn_id: 'DTX-001',
      status: 'SUCCESS',
    });

    expect(EnachMandateExecution.findOne).toHaveBeenCalledTimes(1);
  });

  it('normalizes status to uppercase', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution());
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'success',
    });

    expect(result.status).toBe('SUCCESS');
  });

  it('sets processed_or_failed_at and successOrFailDate on terminal status', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({
      processed_or_failed_at: null,
      successOrFailDate: null,
    }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.processed_or_failed_at).toBeDefined();
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('does not overwrite processed_or_failed_at when already set', async () => {
    const existingDate = new Date('2024-06-01');
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({
      processed_or_failed_at: existingDate,
      successOrFailDate: existingDate,
    }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'FAILED',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.processed_or_failed_at).toBeUndefined();
  });

  it('sets decentro_txn_id when provided and execution does not have one', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({ decentro_txn_id: null }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      decentro_txn_id: 'DTX-NEW',
      status: 'PENDING',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.decentro_txn_id).toBe('DTX-NEW');
  });

  it('does not overwrite existing decentro_txn_id', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({ decentro_txn_id: 'DTX-EXISTING' }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      decentro_txn_id: 'DTX-NEW',
      status: 'PENDING',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.decentro_txn_id).toBeUndefined();
  });

  it('stores provider_response when it is a non-empty object', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution());
    EnachMandateExecution.update.mockResolvedValue([1]);
    const response = { transaction_status: 'SUCCESS', amount: 1000 };

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
      provider_response: response,
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.provider_response).toEqual(response);
  });

  it('does not set provider_response when it is null', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution());
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
      provider_response: null,
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.provider_response).toBeUndefined();
  });

  it('reports statusChanged true when status actually changed', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({ status: 'PENDING' }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    expect(result.statusChanged).toBe(true);
    expect(result.updated).toBe(true);
  });

  it('reports statusChanged false when status did not change', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution({ status: 'SUCCESS' }));
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    expect(result.statusChanged).toBe(false);
  });

  it('throws when db update returns updatedCount of 0', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(makeMockExecution());
    EnachMandateExecution.update.mockResolvedValue([0]);

    await expect(
      updateEnachMandateExecutionStatus({ execution_reference_id: 'EXEC-REF-001', status: 'SUCCESS' })
    ).rejects.toThrow('No eNACH execution found');
  });
});
