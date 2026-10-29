const { calculateTaxBreakdown, calculateAmountWithTax } = require('../GSTandTAXcalculation');
const { getGstDetails } = require('../../models/use-cases/setting');

jest.mock('../../models/use-cases/setting', () => ({
  getGstDetails: jest.fn(),
}));

jest.mock('../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('scheduler calculateTaxBreakdown (keep in sync with paymentGateway copy)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue({ name: 'taxRate', details: { gst: 18, type: 'PERCENTAGE' } });
  });

  it('adds 18% GST on top of the net — same figures as the paymentGateway copy', async () => {
    const result = await calculateTaxBreakdown(999);
    expect(result).toEqual({
      taxableAmount: 999,
      taxAmount: 179.82,
      grossAmount: 1178.82,
      taxRate: 18,
    });
  });

  it('returns all-zero tax for a zero or negative net', async () => {
    expect(await calculateTaxBreakdown(0)).toEqual({ taxableAmount: 0, taxAmount: 0, grossAmount: 0, taxRate: 0 });
    expect(await calculateTaxBreakdown(-10)).toEqual({ taxableAmount: 0, taxAmount: 0, grossAmount: 0, taxRate: 0 });
  });

  it('fails open (tax 0) when the rate setting is missing', async () => {
    getGstDetails.mockResolvedValue(null);
    expect(await calculateTaxBreakdown(500)).toEqual({ taxableAmount: 500, taxAmount: 0, grossAmount: 500, taxRate: 0 });
  });
});

describe('scheduler calculateAmountWithTax (destructuring bugfix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies the DB rate instead of silently returning the un-taxed amount', async () => {
    getGstDetails.mockResolvedValue({ name: 'taxRate', details: { gst: 18, type: 'PERCENTAGE' } });
    expect(await calculateAmountWithTax(100)).toBe(118);
  });
});
