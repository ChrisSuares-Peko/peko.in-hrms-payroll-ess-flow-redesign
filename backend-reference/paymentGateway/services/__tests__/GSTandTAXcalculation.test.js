const { calculateTaxBreakdown } = require('../GSTandTAXcalculation');
const { getGstDetails } = require('../../models/use-cases/setting');

jest.mock('../../models/use-cases/setting', () => ({
  getGstDetails: jest.fn(),
}));

jest.mock('../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const gstSetting = (gst, type = 'PERCENTAGE') => ({ name: 'taxRate', details: { gst, type } });

describe('calculateTaxBreakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGstDetails.mockResolvedValue(gstSetting(18));
  });

  it('adds 18% GST on top of the net and returns the gross as the sum of the rounded parts', async () => {
    const result = await calculateTaxBreakdown(999);
    expect(result).toEqual({
      taxableAmount: 999,
      taxAmount: 179.82,
      grossAmount: 1178.82,
      taxRate: 18,
    });
  });

  it('rounds the tax half-up at the paisa and sums the ROUNDED figures (no net × 1.18 drift)', async () => {
    // 1234.565 → taxable 1234.57 (rounded first); tax = 1234.57 × 0.18 = 222.2226 → 222.22
    const result = await calculateTaxBreakdown(1234.565);
    expect(result.taxableAmount).toBe(1234.57);
    expect(result.taxAmount).toBe(222.22);
    expect(result.grossAmount).toBe(1456.79);
  });

  it('returns all-zero tax for a zero net (voucher / fully-credited purchase)', async () => {
    const result = await calculateTaxBreakdown(0);
    expect(result).toEqual({ taxableAmount: 0, taxAmount: 0, grossAmount: 0, taxRate: 0 });
    expect(getGstDetails).not.toHaveBeenCalled();
  });

  it('clamps a negative net to zero', async () => {
    const result = await calculateTaxBreakdown(-250);
    expect(result).toEqual({ taxableAmount: 0, taxAmount: 0, grossAmount: 0, taxRate: 0 });
  });

  it('treats non-numeric input as zero', async () => {
    const result = await calculateTaxBreakdown(undefined);
    expect(result).toEqual({ taxableAmount: 0, taxAmount: 0, grossAmount: 0, taxRate: 0 });
  });

  it('supports a FLAT tax type (flat amount added, taxRate reported as 0)', async () => {
    getGstDetails.mockResolvedValue(gstSetting(50, 'FLAT'));
    const result = await calculateTaxBreakdown(1000);
    expect(result).toEqual({ taxableAmount: 1000, taxAmount: 50, grossAmount: 1050, taxRate: 0 });
  });

  it('fails open (tax 0) when the rate setting is missing', async () => {
    getGstDetails.mockResolvedValue(null);
    const result = await calculateTaxBreakdown(500);
    expect(result).toEqual({ taxableAmount: 500, taxAmount: 0, grossAmount: 500, taxRate: 0 });
  });

  it('fails open (tax 0) when the rate is not numeric', async () => {
    getGstDetails.mockResolvedValue({ details: { gst: 'abc' } });
    const result = await calculateTaxBreakdown(500);
    expect(result).toEqual({ taxableAmount: 500, taxAmount: 0, grossAmount: 500, taxRate: 0 });
  });

  it('paisa contract: toFixed(2) comparison of gross equals taxable + tax at every magnitude', async () => {
    for (const net of [0.01, 1, 49.5, 999, 4999, 14999, 84745.76, 100000]) {
      const { taxableAmount, taxAmount, grossAmount } = await calculateTaxBreakdown(net);
      expect(Number(grossAmount).toFixed(2)).toBe((taxableAmount + taxAmount).toFixed(2));
    }
  });
});
