const EnachMandate = require('../../../entities/eNachMandate');
const { addEnachMandate } = require('../../eNachMandate');

jest.mock('../../../entities/eNachMandate', () => ({
  create: jest.fn(),
}));

const makeParams = (overrides = {}) => ({
  customer_name: 'Alice',
  customer_phone: '9999999999',
  customer_email: 'alice@example.com',
  account_number: '123456789',
  account_type: 'SAVINGS',
  bank_code: 'HDFC',
  authentication_mode: 'NetBanking',
  amount: 1000,
  frequency: 'Monthly',
  start_date: '2024-01-01',
  end_date: '2025-01-01',
  amount_rule: 'fixed',
  category_code: 'LONS',
  reference_id: 'ENACH-REF-001',
  decentro_txn_id: 'DTX-001',
  decentro_mandate_id: 'MAND-001',
  status: 'PENDING',
  uistreams: null,
  corporateUser: 'user-1',
  mandate_link: 'https://mandate.example.com',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addEnachMandate', () => {
  it('creates a mandate with all provided fields and returns it', async () => {
    const params = makeParams();
    const mockMandate = { id: 1, ...params };
    EnachMandate.create.mockResolvedValue(mockMandate);

    const result = await addEnachMandate(params);

    expect(EnachMandate.create).toHaveBeenCalledTimes(1);
    const createArg = EnachMandate.create.mock.calls[0][0];
    expect(createArg.customer_name).toBe('Alice');
    expect(createArg.account_number).toBe('123456789');
    expect(createArg.corporateUser).toBe('user-1');
    expect(result).toEqual(mockMandate);
  });

  it('strips undefined fields before calling create', async () => {
    EnachMandate.create.mockResolvedValue({ id: 1 });

    await addEnachMandate(makeParams({ customer_email: undefined, uistreams: undefined }));

    const createArg = EnachMandate.create.mock.calls[0][0];
    expect(createArg).not.toHaveProperty('customer_email');
    expect(createArg).not.toHaveProperty('uistreams');
  });

  it('keeps null values (only strips undefined)', async () => {
    EnachMandate.create.mockResolvedValue({ id: 1 });

    await addEnachMandate(makeParams({ uistreams: null }));

    const createArg = EnachMandate.create.mock.calls[0][0];
    expect(createArg).toHaveProperty('uistreams', null);
  });

  it('throws on db error', async () => {
    EnachMandate.create.mockRejectedValue(new Error('DB create failed'));

    await expect(addEnachMandate(makeParams())).rejects.toThrow('DB create failed');
  });
});
