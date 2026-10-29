const { getAllBounus } = require('../../bonus');
const Bonus = require('../../../entities/bonus');

jest.mock('../../../entities/bonus', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

describe('Bonus Use-Cases - getAllBonus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all bonus data for a given corporate user', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      from: new Date(),
      to: new Date(),
    };
    const expectedBonusData = [{ _id: 'bonusId', bonusAmount: 500 }];
    const expectedTotalCount = 1;

    Bonus.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(expectedBonusData)
    });
    Bonus.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await getAllBounus(params);

    expect(Bonus.find).toHaveBeenCalled();
    expect(Bonus.countDocuments).toHaveBeenCalled();
    expect(result).toEqual({
      totalCount: expectedTotalCount,
      bonusData: expectedBonusData,
    });
  });

  it('should return an error if find or countDocuments method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      from: new Date(),
      to: new Date(),
    };
    const expectedError = new Error('Database error');

    Bonus.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(expectedError)
    });

    const result = await getAllBounus(params);

    expect(Bonus.find).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Error);
  });
});
