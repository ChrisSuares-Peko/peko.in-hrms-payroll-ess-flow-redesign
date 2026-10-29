const carReportPlan = require('../../models/entities/carReportPlan');
const { getValue, setValue, deleteValue } = require('../cacheDataMethods');

jest.mock('../../models/entities/carReportPlan', () => ({ findAll: jest.fn() }));
jest.mock('../cacheDataMethods', () => ({
  getValue: jest.fn(),
  setValue: jest.fn(),
  deleteValue: jest.fn(),
}));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const {
  resolvePlanPrice,
  resolvePlanProductCode,
  invalidatePlansCache,
} = require('../carReportPlans');

const PLANS = [
  { reportType: 'valuation', packageId: null, displayName: 'Valuation Report', price: '249.00', vendorProductCode: null, status: true },
  { reportType: 'inspection', packageId: 'basic', displayName: 'Self Inspection', price: '649.00', vendorProductCode: 'code_from_admin', status: true },
  { reportType: 'inspection', packageId: 'premium', displayName: 'Premium Inspection', price: '699.00', vendorProductCode: null, status: true },
  { reportType: 'challan_online', packageId: null, displayName: 'Online Challan Fee', price: '20.00', vendorProductCode: null, status: true },
  { reportType: 'challan_court', packageId: null, displayName: 'Court Challan Fee', price: '50.00', vendorProductCode: null, status: true },
];

beforeEach(() => {
  jest.clearAllMocks();
  getValue.mockResolvedValue(null);
  setValue.mockResolvedValue(undefined);
  carReportPlan.findAll.mockResolvedValue(PLANS);
});

describe('resolvePlanPrice', () => {
  it('prices from the DB rows, not the static maps', async () => {
    expect(await resolvePlanPrice('valuation', {})).toBe(249);
    expect(await resolvePlanPrice('inspection', { packageId: 'basic' })).toBe(649);
  });

  // An active list that lacks the row means "not on sale" — the admin deactivated it.
  it('refuses a product absent from the active plans', async () => {
    expect(await resolvePlanPrice('history', {})).toBeNull();
    expect(await resolvePlanPrice('inspection', { packageId: 'gold-plated' })).toBeNull();
  });

  // Pricing infrastructure being down must never block a purchase.
  it('falls back to the static launch prices when the DB is unreachable', async () => {
    carReportPlan.findAll.mockRejectedValueOnce(new Error('down'));
    expect(await resolvePlanPrice('valuation', {})).toBe(199);
  });

  it('serves from the cache without touching the DB', async () => {
    getValue.mockResolvedValueOnce(JSON.stringify(PLANS));
    expect(await resolvePlanPrice('valuation', {})).toBe(249);
    expect(carReportPlan.findAll).not.toHaveBeenCalled();
  });

  it('caches what it read from the DB', async () => {
    await resolvePlanPrice('valuation', {});
    expect(setValue).toHaveBeenCalledWith('car_report_plans_active', 600, JSON.stringify(PLANS));
  });
});

describe('resolvePlanProductCode', () => {
  it('reads the code from the plan row', async () => {
    expect(await resolvePlanProductCode('basic')).toBe('code_from_admin');
  });

  it('returns null for a package with no code configured', async () => {
    expect(await resolvePlanProductCode('premium')).toBeNull();
  });

  it('falls back to the static map when the DB is unreachable', async () => {
    carReportPlan.findAll.mockRejectedValueOnce(new Error('down'));
    expect(await resolvePlanProductCode('basic')).toBe('self_inspection_tkm_insurance_ai');
  });
});

describe('invalidatePlansCache', () => {
  it('deletes the shared cache key', async () => {
    await invalidatePlansCache();
    expect(deleteValue).toHaveBeenCalledWith('car_report_plans_active');
  });
});
