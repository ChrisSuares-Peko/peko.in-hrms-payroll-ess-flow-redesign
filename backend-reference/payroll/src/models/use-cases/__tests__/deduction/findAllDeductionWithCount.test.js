const Deductions = require('../../../entities/deductions');
const { findAllDeductionWthCount } = require('../../../use-cases/deductions');

jest.mock('../../../entities/deductions');

describe('findAllDeductionWthCount Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the deductions and total count successfully', async () => {
    const params = {
      corporateUserID: 'corporateUserId',
      employeeId: 'employeeId',
      limit: 10,
      skip: 0,
      cycleStart: new Date('2023-01-01'),
      cycleEnd: new Date('2023-12-31'),
      month: 10,
      year: 2023
    };

    // One-time deductions match on their month; legacy rows (no month) on the cycle dates.
    const queryConditions = {
      corporateUser: 'corporateUserId',
      employee: 'employeeId',
      $or: [
        { month: 10, year: 2023 },
        {
          month: { $in: [null] },
          deductionDate: {
            $gte: new Date('2023-01-01'),
            $lte: new Date('2023-12-31')
          }
        }
      ]
    };

    const expectedDeductions = [{ _id: 'deduction1', deductionAmount: 100 }];
    const expectedTotalCount = 1;

    Deductions.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(expectedDeductions)
    });
    Deductions.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await findAllDeductionWthCount(params);

    expect(Deductions.find).toHaveBeenCalledWith(queryConditions);
    expect(Deductions.find().skip).toHaveBeenCalledWith(params.skip);
    expect(Deductions.find().limit).toHaveBeenCalledWith(params.limit);
    expect(Deductions.find().exec).toHaveBeenCalled();
    expect(Deductions.countDocuments).toHaveBeenCalledWith(queryConditions);
    expect(result).toEqual({ totalCount: expectedTotalCount, deductions: expectedDeductions });
  });

  it('should throw an error if the database operation fails', async () => {
    const params = {
      corporateUserID: 'corporateUserId',
      employeeId: 'employeeId',
      limit: 10,
      skip: 0,
      cycleStart: new Date('2023-01-01'),
      cycleEnd: new Date('2023-12-31')
    };

    const errorMessage = 'Something went wrong while fetching deduction';

    console.log = jest.fn();
    Deductions.find.mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error(errorMessage))
    });
    Deductions.countDocuments.mockRejectedValue(new Error(errorMessage));

    await expect(findAllDeductionWthCount(params)).rejects.toThrow(errorMessage);
  });
});
