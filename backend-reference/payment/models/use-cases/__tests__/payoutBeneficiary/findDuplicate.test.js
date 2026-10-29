const payoutBeneficiary = require('../../../entities/payoutBeneficiary');
const { findDuplicate } = require('../../payoutBeneficiary');

jest.mock('../../../entities/payoutBeneficiary', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/payoutTransaction', () => ({}));

describe('findDuplicate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check by upiId when provided', async () => {
    payoutBeneficiary.findOne.mockResolvedValue(null);

    await findDuplicate({ credentialId: 1, upiId: 'john@upi' });

    const where = payoutBeneficiary.findOne.mock.calls[0][0].where;
    expect(where.upiId).toBe('john@upi');
    expect(where.accountNumber).toBeUndefined();
  });

  it('should check by accountNumber and ifscCode when upiId is absent', async () => {
    payoutBeneficiary.findOne.mockResolvedValue(null);

    await findDuplicate({ credentialId: 1, accountNumber: '123456', ifscCode: 'HDFC0001' });

    const where = payoutBeneficiary.findOne.mock.calls[0][0].where;
    expect(where.accountNumber).toBe('123456');
    expect(where.ifscCode).toBe('HDFC0001');
  });

  it('should return the existing record when a duplicate is found', async () => {
    const existing = { id: 5, accountNumber: '123456' };
    payoutBeneficiary.findOne.mockResolvedValue(existing);

    const result = await findDuplicate({ credentialId: 1, accountNumber: '123456', ifscCode: 'HDFC0001' });

    expect(result).toEqual(existing);
  });

  it('should exclude the given id when excludeId is provided', async () => {
    payoutBeneficiary.findOne.mockResolvedValue(null);

    await findDuplicate({ credentialId: 1, accountNumber: '123', ifscCode: 'XYZ', excludeId: 7 });

    const where = payoutBeneficiary.findOne.mock.calls[0][0].where;
    expect(where.id).toBeDefined();
  });
});
