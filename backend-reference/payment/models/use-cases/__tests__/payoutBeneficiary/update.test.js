const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { update } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ update: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when a row is updated', async () => {
    payoutBeneficiary.update.mockResolvedValue([1]);

    const result = await update(3, 1, { name: 'Updated Name' });

    expect(payoutBeneficiary.update).toHaveBeenCalledWith(
      { name: 'Updated Name' },
      { where: { id: 3, credentialId: 1 } }
    );
    expect(result).toBe(true);
  });

  it('should return false when no row matches', async () => {
    payoutBeneficiary.update.mockResolvedValue([0]);

    const result = await update(999, 1, { name: 'Ghost' });

    expect(result).toBe(false);
  });
});
