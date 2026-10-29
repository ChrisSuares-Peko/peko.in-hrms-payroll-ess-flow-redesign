const mongoose = require('mongoose');
const { fetchBonusByEmployeeAndCorporateUser } = require('../../bonus');
const Bonus = require('../../../entities/bonus');

jest.mock('../../../entities/bonus', () => ({
  find: jest.fn(),
}));

describe('Bonus Use-Cases - fetchBonusByEmployeeAndCorporateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch unpaid bonuses for a given employee and corporate user within a date range', async () => {
    const employeeId = new mongoose.Types.ObjectId().toString();
    const corporateUserId = 'corporateUserID';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');
    const expectedBonuses = [
      { _id: new mongoose.Types.ObjectId().toString(), bonusAmount: 100 },
      { _id: new mongoose.Types.ObjectId().toString(), bonusAmount: 200 },
    ];
    const expectedResult = {
      totalBonusPay: 300,
      bonusIds: expectedBonuses.map(bonus => bonus._id),
    };

    Bonus.find.mockResolvedValue(expectedBonuses);

    const result = await fetchBonusByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

    expect(Bonus.find).toHaveBeenCalledWith({
      employee: new mongoose.Types.ObjectId(employeeId),
      corporateUser: corporateUserId,
      bonusDate: {
        $gte: cycleStart,
        $lte: cycleEnd,
      },
      paymentStatus: 'UNPAID',
    }, { bonusAmount: 1, _id: 1 });
    expect(result).toEqual(expectedResult);
  });

  it('should return an error if the find method throws an error', async () => {
    const employeeId = new mongoose.Types.ObjectId().toString();
    const corporateUserId = 'corporateUserID';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');
    const expectedError = new Error('Database error');

    Bonus.find.mockRejectedValue(expectedError);

    const result = await fetchBonusByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

    expect(Bonus.find).toHaveBeenCalledWith({
      employee: new mongoose.Types.ObjectId(employeeId),
      corporateUser: corporateUserId,
      bonusDate: {
        $gte: cycleStart,
        $lte: cycleEnd,
      },
      paymentStatus: 'UNPAID',
    }, { bonusAmount: 1, _id: 1 });
    expect(result).toBe(expectedError);
  });
});
