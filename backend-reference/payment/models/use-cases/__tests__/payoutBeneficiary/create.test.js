const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { create } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({
  create: jest.fn(),
}));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call payoutBeneficiary.create with correct data and return result', async () => {
    const data = { credentialId: 1, name: 'John', accountNumber: '123456', ifscCode: 'HDFC0001' };
    const mockResult = { id: 10, ...data };
    payoutBeneficiary.create.mockResolvedValue(mockResult);

    const result = await create(data);

    expect(payoutBeneficiary.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockResult);
  });

  it('should propagate errors from the entity', async () => {
    payoutBeneficiary.create.mockRejectedValue(new Error('DB error'));
    await expect(create({})).rejects.toThrow('DB error');
  });
});
