const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { findAllEnachMandateExecutions } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

const makeMockExecution = (overrides = {}) => ({
  id: 1,
  execution_reference_id: 'EXEC-REF-001',
  mandate_reference_id: 'ENACH-REF-001',
  corporateUser: 'user-1',
  status: 'PENDING',
  amount: 1000,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('findAllEnachMandateExecutions', () => {
  it('returns count and rows for the given mandate and user', async () => {
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
  });

  it('applies default pagination (limit=10, offset=0)', async () => {
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
    expect(call.offset).toBe(15);
  });

  it('orders results by createdAt DESC with raw: true', async () => {
    EnachMandateExecution.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllEnachMandateExecutions({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
    });

    const call = EnachMandateExecution.findAndCountAll.mock.calls[0][0];
    expect(call.order).toEqual([['createdAt', 'DESC']]);
    expect(call.raw).toBe(true);
  });

  it('returns empty result when no executions exist', async () => {
    EnachMandateExecution.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await findAllEnachMandateExecutions({
      mandate_reference_id: 'ENACH-REF-001',
      corporateUser: 'user-1',
    });

    expect(result.count).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('throws on db error', async () => {
    EnachMandateExecution.findAndCountAll.mockRejectedValue(new Error('Query failed'));

    await expect(
      findAllEnachMandateExecutions({ mandate_reference_id: 'ENACH-REF-001', corporateUser: 'user-1' })
    ).rejects.toThrow('Query failed');
  });
});
