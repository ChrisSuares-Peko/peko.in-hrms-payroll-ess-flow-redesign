const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { findOne } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('findOne', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the beneficiary matching id and credentialId', async () => {
    const beneficiary = { id: 3, credentialId: 1, name: 'Alice' };
    payoutBeneficiary.findOne.mockResolvedValue(beneficiary);

    const result = await findOne(3, 1);

    expect(payoutBeneficiary.findOne).toHaveBeenCalledWith({ where: { id: 3, credentialId: 1 } });
    expect(result).toEqual(beneficiary);
  });

  it('should return null when no match is found', async () => {
    payoutBeneficiary.findOne.mockResolvedValue(null);

    const result = await findOne(999, 1);

    expect(result).toBeNull();
  });
});
