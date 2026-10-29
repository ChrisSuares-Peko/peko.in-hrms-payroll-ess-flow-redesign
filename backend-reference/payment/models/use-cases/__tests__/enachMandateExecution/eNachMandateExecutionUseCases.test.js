const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { Op } = require('sequelize');

const {
  addEnachMandateExecution,
  findAllEnachMandateExecutions,
  updateEnachMandateExecutionByReferenceId,
  findEnachMandateExecutionByReferenceId,
  findEnachMandateExecutionByDecentroTxnId,
  updateEnachMandateExecutionStatus,
  findLatestEnachMandateExecutionByStatuses,
} = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'PROCESSED', 'COMPLETED', 'FAILED', 'FAILURE']),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeExecParams = (overrides = {}) => ({
  execution_reference_id: 'EXEC-REF-001',
  mandate_reference_id: 'ENACH-REF-001',
  enach_mandate_id: 1,
  corporateUser: 'user-1',
  decentro_mandate_id: 'MAND-001',
  decentro_txn_id: 'DTX-001',
  transaction_reference: 'TXN-REF-001',
  payment_date: '2024-02-15',
  amount: 1000,
  status: 'INITIATED',
  processed_or_failed_at: null,
  provider_response: null,
  ...overrides,
});

const makeMockExecution = (overrides = {}) => ({
  id: 1,
  ...makeExecParams(),
  createdAt: new Date('2024-01-01'),
  successOrFailDate: null,
  toJSON: jest.fn(function () { return { ...this }; }),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// addEnachMandateExecution
// ─────────────────────────────────────────────────────────────────────────────

describe('addEnachMandateExecution', () => {
  it('creates an execution record and returns it', async () => {
    const params = makeExecParams();
    const mockRecord = makeMockExecution();
    EnachMandateExecution.create.mockResolvedValue(mockRecord);

    const result = await addEnachMandateExecution(params);

    expect(EnachMandateExecution.create).toHaveBeenCalledTimes(1);
    const createArg = EnachMandateExecution.create.mock.calls[0][0];
    expect(createArg.execution_reference_id).toBe('EXEC-REF-001');
    expect(createArg.mandate_reference_id).toBe('ENACH-REF-001');
    expect(createArg.amount).toBe(1000);
    expect(result).toEqual(mockRecord);
  });

  it('strips undefined fields before create', async () => {
    const params = makeExecParams({ decentro_txn_id: undefined, provider_response: undefined });
    EnachMandateExecution.create.mockResolvedValue(makeMockExecution());

    await addEnachMandateExecution(params);

    const createArg = EnachMandateExecution.create.mock.calls[0][0];
    expect(createArg).not.toHaveProperty('decentro_txn_id');
    expect(createArg).not.toHaveProperty('provider_response');
  });

  it('throws on db error', async () => {
    EnachMandateExecution.create.mockRejectedValue(new Error('Create error'));

    await expect(addEnachMandateExecution(makeExecParams())).rejects.toThrow('Create error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findAllEnachMandateExecutions
// ─────────────────────────────────────────────────────────────────────────────

describe('findAllEnachMandateExecutions', () => {
  it('returns count and rows for the mandate', async () => {
    const rows = [makeMockExecution()];
    EnachMandateExecution.findAndCountAll.mockResolvedValue({ count: 1, rows });

    const result = await findAllEnachMandateExecutions({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
    });

    expect(result.count).toBe(1);
    expect(result.rows).toEqual(rows);

    const call = EnachMandateExecution.findAndCountAll.mock.calls[0][0];
    expect(call.where.mandate_reference_id).toBe('ENACH-REF-001');
    expect(call.where.corporateUser).toBe('user-1');
    expect(call.order).toEqual([['createdAt', 'DESC']]);
    expect(call.raw).toBe(true);
  });

  it('uses default pagination (limit=10, page=0)', async () => {
    EnachMandateExecution.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandateExecutions({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
    });

    const call = EnachMandateExecution.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(10);
    expect(call.offset).toBe(0);
  });

  it('applies custom limit and page', async () => {
    EnachMandateExecution.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandateExecutions({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      limit: 5,
      page: 3,
    });

    const call = EnachMandateExecution.findAndCountAll.mock.calls[0][0];
    expect(call.limit).toBe(5);
    expect(call.offset).toBe(15); // 5 * 3
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(
      findAllEnachMandateExecutions({ mandate_reference_id: 'ENACH-REF-001', corporateUser: 'user-1' })
    ).rejects.toThrow('Query failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateEnachMandateExecutionByReferenceId
// ─────────────────────────────────────────────────────────────────────────────

describe('updateEnachMandateExecutionByReferenceId', () => {
  it('updates and returns updatedCount', async () => {
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionByReferenceId('EXEC-REF-001', { status: 'SUCCESS' });

    expect(EnachMandateExecution.update).toHaveBeenCalledWith(
      { status: 'SUCCESS' },
      { where: { execution_reference_id: 'EXEC-REF-001' } }
    );
    expect(result).toBe(1);
  });

  it('returns 0 when record not found', async () => {
    EnachMandateExecution.update.mockResolvedValue([0]);

    const result = await updateEnachMandateExecutionByReferenceId('EXEC-NONE', { status: 'FAILED' });

    expect(result).toBe(0);
  });

  it('throws on db error', async () => {
    EnachMandateExecution.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      updateEnachMandateExecutionByReferenceId('EXEC-REF-001', { status: 'SUCCESS' })
    ).rejects.toThrow('Update failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findEnachMandateExecutionByReferenceId
// ─────────────────────────────────────────────────────────────────────────────

describe('findEnachMandateExecutionByReferenceId', () => {
  it('returns the execution when found', async () => {
    const exec = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(exec);

    const result = await findEnachMandateExecutionByReferenceId('EXEC-REF-001');

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: { execution_reference_id: 'EXEC-REF-001' },
    });
    expect(result).toEqual(exec);
  });

  it('returns null without querying when execution_reference_id is falsy', async () => {
    const result = await findEnachMandateExecutionByReferenceId(null);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when not found in db', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    const result = await findEnachMandateExecutionByReferenceId('EXEC-NOTFOUND');

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findEnachMandateExecutionByReferenceId('EXEC-REF-001')).rejects.toThrow('DB error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findEnachMandateExecutionByDecentroTxnId
// ─────────────────────────────────────────────────────────────────────────────

describe('findEnachMandateExecutionByDecentroTxnId', () => {
  it('returns the execution when found', async () => {
    const exec = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(exec);

    const result = await findEnachMandateExecutionByDecentroTxnId('DTX-001');

    expect(EnachMandateExecution.findOne).toHaveBeenCalledWith({
      where: { decentro_txn_id: 'DTX-001' },
    });
    expect(result).toEqual(exec);
  });

  it('returns null without querying when decentro_txn_id is falsy', async () => {
    const result = await findEnachMandateExecutionByDecentroTxnId(null);

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('Lookup failed'));

    await expect(findEnachMandateExecutionByDecentroTxnId('DTX-001')).rejects.toThrow('Lookup failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateEnachMandateExecutionStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('updateEnachMandateExecutionStatus', () => {
  it('throws when both identifiers are missing', async () => {
    await expect(
      updateEnachMandateExecutionStatus({ status: 'SUCCESS' })
    ).rejects.toThrow('Either execution_reference_id or decentro_txn_id is required');
  });

  it('throws when status is missing', async () => {
    await expect(
      updateEnachMandateExecutionStatus({ execution_reference_id: 'EXEC-REF-001' })
    ).rejects.toThrow('status is required');
  });

  it('throws when no execution found by either identifier', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    await expect(
      updateEnachMandateExecutionStatus({
        execution_reference_id: 'EXEC-NONE',
        status: 'SUCCESS',
      })
    ).rejects.toThrow('No eNACH execution found');
  });

  it('updates status and returns result', async () => {
    const exec = makeMockExecution({ status: 'INITIATED' });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'PROCESSING',
    });

    expect(result.updated).toBe(true);
    expect(result.status).toBe('PROCESSING');
    expect(result.statusChanged).toBe(true);
  });

  it('sets processed_or_failed_at and successOrFailDate for terminal statuses', async () => {
    const exec = makeMockExecution({ status: 'INITIATED', processed_or_failed_at: null, successOrFailDate: null });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.processed_or_failed_at).toBeDefined();
    expect(updateArg.successOrFailDate).toBeDefined();
  });

  it('does NOT override processed_or_failed_at if already set', async () => {
    const existingDate = new Date('2024-01-10');
    const exec = makeMockExecution({ status: 'INITIATED', processed_or_failed_at: existingDate, successOrFailDate: existingDate });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'FAILED',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('processed_or_failed_at');
    expect(updateArg).not.toHaveProperty('successOrFailDate');
  });

  it('saves provider_response when provided', async () => {
    const exec = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    const providerResponse = { transactionStatus: 'SUCCESS', txnId: 'DTX-999' };
    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
      provider_response: providerResponse,
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.provider_response).toEqual(providerResponse);
  });

  it('does not save empty provider_response', async () => {
    const exec = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
      provider_response: {},
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('provider_response');
  });

  it('sets decentro_txn_id when provided and not already set', async () => {
    const exec = makeMockExecution({ decentro_txn_id: null });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      decentro_txn_id: 'DTX-NEW',
      status: 'PROCESSING',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg.decentro_txn_id).toBe('DTX-NEW');
  });

  it('does not override decentro_txn_id when already set', async () => {
    const exec = makeMockExecution({ decentro_txn_id: 'DTX-EXISTING' });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      decentro_txn_id: 'DTX-NEW',
      status: 'PROCESSING',
    });

    const updateArg = EnachMandateExecution.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('decentro_txn_id');
  });

  it('falls back to decentro_txn_id lookup when execution_reference_id lookup returns null', async () => {
    const exec = makeMockExecution();
    // First call (by reference id) returns null, second call (by txn id) returns the execution
    EnachMandateExecution.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-MISSING',
      decentro_txn_id: 'DTX-001',
      status: 'SUCCESS',
    });

    expect(EnachMandateExecution.findOne).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(true);
  });

  it('throws when updatedCount is 0', async () => {
    const exec = makeMockExecution();
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([0]);

    await expect(
      updateEnachMandateExecutionStatus({ execution_reference_id: 'EXEC-REF-001', status: 'SUCCESS' })
    ).rejects.toThrow('No eNACH execution found');
  });

  it('returns statusChanged as false when status is unchanged', async () => {
    const exec = makeMockExecution({ status: 'SUCCESS' });
    EnachMandateExecution.findOne.mockResolvedValue(exec);
    EnachMandateExecution.update.mockResolvedValue([1]);

    const result = await updateEnachMandateExecutionStatus({
      execution_reference_id: 'EXEC-REF-001',
      status: 'SUCCESS',
    });

    expect(result.statusChanged).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findLatestEnachMandateExecutionByStatuses
// ─────────────────────────────────────────────────────────────────────────────

describe('findLatestEnachMandateExecutionByStatuses', () => {
  it('returns null when statuses array is empty', async () => {
    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: [],
    });

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('returns null when statuses is not an array', async () => {
    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: 'SUCCESS',
    });

    expect(EnachMandateExecution.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('queries with IN clause for provided statuses', async () => {
    const exec = makeMockExecution({ status: 'SUCCESS' });
    EnachMandateExecution.findOne.mockResolvedValue(exec);

    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: ['SUCCESS', 'COMPLETED'],
    });

    expect(EnachMandateExecution.findOne).toHaveBeenCalledTimes(1);
    const call = EnachMandateExecution.findOne.mock.calls[0][0];
    expect(call.where.mandate_reference_id).toBe('ENACH-REF-001');
    expect(call.where.corporateUser).toBe('user-1');
    expect(call.where.status[Op.in]).toEqual(['SUCCESS', 'COMPLETED']);
    expect(call.order).toEqual([['createdAt', 'DESC']]);
    expect(call.raw).toBe(true);
    expect(result).toEqual(exec);
  });

  it('returns null when no execution matches the statuses', async () => {
    EnachMandateExecution.findOne.mockResolvedValue(null);

    const result = await findLatestEnachMandateExecutionByStatuses({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
      statuses: ['SUCCESS'],
    });

    expect(result).toBeNull();
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findOne.mockRejectedValue(new Error('DB error'));

    await expect(
      findLatestEnachMandateExecutionByStatuses({
        mandate_reference_id: 'ENACH-REF-001',
        corporateUser: 'user-1',
        statuses: ['SUCCESS'],
      })
    ).rejects.toThrow('DB error');
  });
});
