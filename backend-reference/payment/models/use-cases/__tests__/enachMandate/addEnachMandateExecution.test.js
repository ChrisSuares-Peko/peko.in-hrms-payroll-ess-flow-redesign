const EnachMandateExecution = require('../../../entities/eNachMandateExecution');
const { addEnachMandateExecution } = require('../../eNachMandateExecution');

jest.mock('../../../entities/eNachMandateExecution', () => ({
  create: jest.fn(),
}));

jest.mock('../../../../utils/paymentLinks', () => ({
  ENACH_EXECUTION_TERMINAL_STATUSES: new Set(['SUCCESS', 'FAILED', 'CANCELLED', 'REJECTED']),
}));

const makeParams = (overrides = {}) => ({
  execution_reference_id: 'EXEC-REF-001',
  mandate_reference_id: 'ENACH-REF-001',
  enach_mandate_id: 1,
  corporateUser: 'user-1',
  decentro_mandate_id: 'MAND-001',
  decentro_txn_id: 'DTX-001',
  transaction_reference: 'TXN-REF-001',
  payment_date: '2024-01-15',
  amount: 1000,
  status: 'PENDING',
  processed_or_failed_at: null,
  provider_response: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addEnachMandateExecution', () => {
  it('creates an execution record and returns it', async () => {
    const mockExecution = { id: 1, ...makeParams() };
    EnachMandateExecution.create.mockResolvedValue(mockExecution);

    const result = await addEnachMandateExecution(makeParams());

    expect(EnachMandateExecution.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockExecution);
  });

  it('passes all defined fields to create', async () => {
    EnachMandateExecution.create.mockResolvedValue({ id: 1 });
    const params = makeParams();

    await addEnachMandateExecution(params);

    const createArg = EnachMandateExecution.create.mock.calls[0][0];
    expect(createArg.execution_reference_id).toBe('EXEC-REF-001');
    expect(createArg.mandate_reference_id).toBe('ENACH-REF-001');
    expect(createArg.corporateUser).toBe('user-1');
    expect(createArg.amount).toBe(1000);
  });

  it('strips undefined fields before calling create', async () => {
    EnachMandateExecution.create.mockResolvedValue({ id: 1 });

    await addEnachMandateExecution(makeParams({ provider_response: undefined, decentro_txn_id: undefined }));

    const createArg = EnachMandateExecution.create.mock.calls[0][0];
    expect(createArg).not.toHaveProperty('provider_response');
    expect(createArg).not.toHaveProperty('decentro_txn_id');
  });

  it('keeps null values (only strips undefined)', async () => {
    EnachMandateExecution.create.mockResolvedValue({ id: 1 });

    await addEnachMandateExecution(makeParams({ provider_response: null }));

    const createArg = EnachMandateExecution.create.mock.calls[0][0];
    expect(createArg).toHaveProperty('provider_response', null);
  });

  it('throws on db error', async () => {
    EnachMandateExecution.create.mockRejectedValue(new Error('Create failed'));

    await expect(addEnachMandateExecution(makeParams())).rejects.toThrow('Create failed');
  });
});
