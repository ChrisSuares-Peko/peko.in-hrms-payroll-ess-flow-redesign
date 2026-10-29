const { createBonusData } = require('../../bonus');
const Bonus = require('../../../entities/bonus');

jest.mock('../../../entities/bonus');

describe('Bonus Use-Cases - createBonusData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return the new bonus data', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      employeeId: 'employeeId',
      bonusData: {
        bonusAmount: 500,
        bonusDate: new Date(),
        paymentStatus: 'UNPAID'
      }
    };
    const expectedBonus = { _id: 'bonusId', ...params.bonusData };

    Bonus.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(expectedBonus)
    }));

    const result = await createBonusData(params);

    expect(Bonus).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      employee: params.employeeId,
      ...params.bonusData
    });
    expect(result).toEqual(expectedBonus);
  });

  it('should return an error if the save method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      employeeId: 'employeeId',
      bonusData: {
        bonusAmount: 500,
        bonusDate: new Date(),
        paymentStatus: 'UNPAID'
      }
    };
    const expectedError = new Error('Database error');

    Bonus.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(expectedError)
    }));

    const result = await createBonusData(params);

    expect(Bonus).toHaveBeenCalledWith({
      corporateUser: params.corporateUserID,
      employee: params.employeeId,
      ...params.bonusData
    });
    expect(result).toBe(expectedError);
  });
});
