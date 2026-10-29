const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { deleteOne } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ destroy: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('deleteOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when a row is deleted', async () => {
    payoutBeneficiary.destroy.mockResolvedValue(1);

    const result = await deleteOne(3, 1);

    expect(payoutBeneficiary.destroy).toHaveBeenCalledWith({ where: { id: 3, credentialId: 1 } });
    expect(result).toBe(true);
  });

  it('should return false when no row matches', async () => {
    payoutBeneficiary.destroy.mockResolvedValue(0);

    const result = await deleteOne(999, 1);

    expect(result).toBe(false);
  });
});
