const mongoose = require('mongoose');
const { getAllBounusUsingId } = require('../../bonus');
const Bonus = require('../../../entities/bonus');

jest.mock('../../../entities/bonus', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

describe('Bonus Use-Cases - getAllBonusUsingId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all bonus data for a given employee and corporate user', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      employeeId: new mongoose.Types.ObjectId(),
      page: 1,
      limit: 10,
      searchText: '',
      month: 1,
      year: 2024,
    };
    const expectedBonusData = [{ _id: new mongoose.Types.ObjectId(), bonusAmount: 500 }];
    const expectedTotalCount = 1;

    Bonus.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(expectedBonusData)
    });
    Bonus.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await getAllBounusUsingId(params);

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
      employeeId: new mongoose.Types.ObjectId(),
      page: 1,
      limit: 10,
      searchText: '',
      month: 1,
      year: 2024,
    };
    const expectedError = new Error('Database error');

    Bonus.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(expectedError)
    });
    Bonus.countDocuments.mockRejectedValue(expectedError);

    const result = await getAllBounusUsingId(params);

    expect(Bonus.find).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Error);
  });
});
