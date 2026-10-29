const { sumVerificationAddonQuantity } = require('../../verificationAddon');
const transaction = require('../../../entities/transaction');

jest.mock('../../../entities/transaction');
jest.mock('../../../entities/order');
jest.mock('../../../entities/credential');
jest.mock('../../../entities/categories');
jest.mock('../../../entities/subCorporateUsers');
jest.mock('../../../entities/works');
jest.mock('../../../entities/pekoCloud/cloud_employees');
jest.mock('../../../entities/serviceOperator');

describe('sumVerificationAddonQuantity', () => {
  const REAL_DATE_NOW = Date.now;

  beforeEach(() => {
    jest.clearAllMocks();
    // Pin "now" so expiry comparisons are deterministic.
    jest.useFakeTimers().setSystemTime(new Date('2026-07-16T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
    Date.now = REAL_DATE_NOW;
  });

  it('should query SUCCESS Verification Suite Addon transactions for the given credential', async () => {
    transaction.findAll.mockResolvedValue([]);

    await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(transaction.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: 42,
        transactionCategory: 'Verification Suite Addon',
        status: 'SUCCESS',
      },
      include: [{ model: expect.anything(), attributes: ['orderResponse'] }],
      raw: true,
      nest: true,
    });
  });

  it('should return zero quantity and null nextExpiresAt when there are no rows', async () => {
    transaction.findAll.mockResolvedValue([]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result).toEqual({ quantity: 0, nextExpiresAt: null });
  });

  it('should sum the quantity of still-valid (unexpired) add-ons', async () => {
    transaction.findAll.mockResolvedValue([
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 3, expiresAt: '2026-08-01T00:00:00.000Z' } }) } },
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 5, expiresAt: '2026-09-01T00:00:00.000Z' } }) } },
    ]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result.quantity).toBe(8);
  });

  it('should exclude add-ons whose expiresAt has already passed', async () => {
    transaction.findAll.mockResolvedValue([
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 3, expiresAt: '2026-07-01T00:00:00.000Z' } }) } }, // expired
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 5, expiresAt: '2026-09-01T00:00:00.000Z' } }) } }, // valid
    ]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result.quantity).toBe(5);
  });

  it('should exclude rows with no expiresAt at all', async () => {
    transaction.findAll.mockResolvedValue([
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 3 } }) } },
    ]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result.quantity).toBe(0);
  });

  it('should return the soonest (earliest) expiresAt among multiple valid add-ons, regardless of row order', async () => {
    transaction.findAll.mockResolvedValue([
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 5, expiresAt: '2026-09-01T00:00:00.000Z' } }) } },
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 3, expiresAt: '2026-07-20T00:00:00.000Z' } }) } },
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 2, expiresAt: '2026-08-01T00:00:00.000Z' } }) } },
    ]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result.nextExpiresAt).toEqual(new Date('2026-07-20T00:00:00.000Z'));
    expect(result.quantity).toBe(10);
  });

  it('should skip rows with malformed/missing orderResponse JSON without throwing', async () => {
    transaction.findAll.mockResolvedValue([
      { order: { orderResponse: 'not-json' } },
      { order: null },
      { order: { orderResponse: JSON.stringify({ Result: { quantity: 4, expiresAt: '2026-09-01T00:00:00.000Z' } }) } },
    ]);

    const result = await sumVerificationAddonQuantity({ credentialId: 42 });

    expect(result.quantity).toBe(4);
    expect(result.nextExpiresAt).toEqual(new Date('2026-09-01T00:00:00.000Z'));
  });

  it('should propagate errors from the database', async () => {
    transaction.findAll.mockRejectedValue(new Error('DB Error'));

    await expect(sumVerificationAddonQuantity({ credentialId: 42 })).rejects.toThrow('DB Error');
  });
});
