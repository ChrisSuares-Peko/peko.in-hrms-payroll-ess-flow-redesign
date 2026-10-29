const { fetchRecentBeneficiaries } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');
const serviceOperators = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/beneficiary', () => ({
  findAll: jest.fn(),
}));

describe('fetchRecentBeneficiaries', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch recent beneficiaries with correct filters, include, limit and order', async () => {
    const mockCredentialId = 10;
    const mockAccessKeys = ['KEY1', 'KEY2'];
    const mockResult = [{ id: 1 }, { id: 2 }];

    beneficiary.findAll.mockResolvedValue(mockResult);

    const result = await fetchRecentBeneficiaries(mockCredentialId, mockAccessKeys);

    expect(beneficiary.findAll).toHaveBeenCalledWith({
      where: {
        accessKey: {
          [Op.in]: mockAccessKeys
        },
        credentialId: mockCredentialId
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: serviceOperators }]
    });

    expect(result).toBe(mockResult);
  });


  it('should return empty array when no beneficiaries exist', async () => {
    beneficiary.findAll.mockResolvedValue([]);

    const result = await fetchRecentBeneficiaries(1, ['K']);

    expect(result).toEqual([]);
  });
  it('should catch errors and log them instead of throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const mockError = new Error('Something broke');

    beneficiary.findAll.mockRejectedValue(mockError);

    await fetchRecentBeneficiaries(1, ['A']);

    // first log: whole error
    expect(consoleSpy).toHaveBeenCalledWith(mockError);

    // second log: error.message.message (your weird nested logging)
    expect(consoleSpy).toHaveBeenCalledWith(undefined);

    consoleSpy.mockRestore();
  });
  it('should always log the final message', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

    beneficiary.findAll.mockResolvedValue([]);

    await fetchRecentBeneficiaries(1, ['X']);

    // last log
    expect(consoleSpy).toHaveBeenCalledWith('FETCH BENEFICIARY  ROUTE CALLED');

    consoleSpy.mockRestore();
  });

});
