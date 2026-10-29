const { createLeanPayout } = require('../../payout');
const payouts = require('../../../entities/payout');

jest.mock('../../../entities/payout', () => ({
  create: jest.fn(),
}));

describe('payout - createLeanPayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a new payout', async () => {
    const mockParams = { amount: 100, credentialId: 'C1', bankAccountId: 'B1' };
    const mockResult = { id: 1, ...mockParams };

    payouts.create.mockResolvedValue(mockResult);

    const result = await createLeanPayout(mockParams);

    expect(payouts.create).toHaveBeenCalledWith(mockParams);
    expect(result).toEqual(mockResult);
  });

  it('should throw error when creation fails', async () => {
    payouts.create.mockRejectedValue(new Error('DB Error'));

    await expect(createLeanPayout({ amount: 100 })).rejects.toThrow('DB Error');
  });
});
