const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { countActive } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ count: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('countActive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return count of active beneficiaries for a credential', async () => {
    payoutBeneficiary.count.mockResolvedValue(4);

    const result = await countActive(1);

    expect(payoutBeneficiary.count).toHaveBeenCalledWith({ where: { credentialId: 1, status: 'ACTIVE' } });
    expect(result).toBe(4);
  });

  it('should return 0 when no active beneficiaries exist', async () => {
    payoutBeneficiary.count.mockResolvedValue(0);

    const result = await countActive(99);

    expect(result).toBe(0);
  });
});
