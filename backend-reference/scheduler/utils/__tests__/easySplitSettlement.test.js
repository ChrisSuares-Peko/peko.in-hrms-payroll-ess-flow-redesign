jest.mock('axios', () => ({ default: jest.fn() }));
jest.mock('../easySplit', () => ({
  getEasySplitSettings: jest.fn(),
  isEasySplitEnabled: jest.fn(),
  resolveConfig: jest.fn(),
}));
jest.mock('../../models/entities/ondc_order', () => ({
  sequelize: { query: jest.fn() },
}));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const { default: axios } = require('axios');
const {
  getEasySplitSettings,
  isEasySplitEnabled,
  resolveConfig,
} = require('../easySplit');
const ondcOrders = require('../../models/entities/ondc_order');
const {
  formatCashfreeDate,
  resolveDeferBaseUrl,
  setSettlementEligibility,
} = require('../easySplitSettlement');

beforeEach(() => {
  jest.clearAllMocks();
  getEasySplitSettings.mockResolvedValue({ payoutHoldEnabled: true, deferBaseUrl: null });
  isEasySplitEnabled.mockResolvedValue(true);
  resolveConfig.mockResolvedValue({
    clientId: 'CF_ID',
    clientSecret: 'REDACTED',
    baseUrl: 'https://sandbox.cashfree.com',
  });
  ondcOrders.sequelize.query.mockResolvedValue([1]);
  axios.mockResolvedValue({ status: 200, data: { status: 'OK' } });
});

describe('formatCashfreeDate', () => {
  it('formats as IST wall time without a zone marker', () => {
    // 2026-08-28T06:30:00Z = 12:00:00 IST
    expect(formatCashfreeDate(new Date('2026-08-28T06:30:00Z'))).toBe('2026-08-28 12:00:00');
  });

  it('returns null for an unusable value', () => {
    expect(formatCashfreeDate('not-a-date')).toBeNull();
  });
});

describe('resolveDeferBaseUrl', () => {
  it('maps sandbox split host to test.cashfree.com', () => {
    expect(resolveDeferBaseUrl('https://sandbox.cashfree.com')).toBe('https://test.cashfree.com');
  });

  it('honours deferBaseUrl override', () => {
    expect(resolveDeferBaseUrl('https://sandbox.cashfree.com', {
      deferBaseUrl: 'https://custom.example/',
    })).toBe('https://custom.example');
  });
});

describe('setSettlementEligibility', () => {
  it('skips without calling Cashfree when there is no gateway order id', async () => {
    const result = await setSettlementEligibility({
      vendorId: 'v1',
      date: new Date(),
      action: 'RELEASE',
    });
    expect(result.reason).toBe('no_gateway_order_id');
    expect(axios).not.toHaveBeenCalled();
  });

  it('PUTs RELEASE to the defer-settlement host', async () => {
    const date = new Date('2026-08-28T06:30:00Z');
    const result = await setSettlementEligibility({
      gatewayOrderId: 'cf_1',
      vendorId: 'vendor_1',
      date,
      action: 'RELEASE',
      transactionId: 'txn-1',
    });

    expect(result.status).toBe(true);
    expect(axios).toHaveBeenCalledWith(expect.objectContaining({
      method: 'PUT',
      url: 'https://test.cashfree.com/api/v2/easy-split/orders/cf_1/settlement-eligibility/vendors/vendor_1',
      data: { settlementEligibilityDateUpdate: '2026-08-28 12:00:00' },
    }));
  });
});
