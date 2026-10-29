const Deductions = require('../../../entities/deductions');
const { createDeduction } = require('../../../use-cases/deductions');

jest.mock('../../../entities/deductions');

describe('createDeduction Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should create and return a new deduction successfully', async () => {
    const params = {
      employeeId: 'employeeId',
      corporateUserID: 'corporateUserId',
      deductionAmount: 100,
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionStatus: 'PENDING'
    };

    const expectedDeduction = {
      _id: 'deductionId',
      employee: 'employeeId',
      corporateUser: 'corporateUserId',
      deductionAmount: 100,
      deductionDate: params.deductionDate,
      deductionType: 'Type',
      deductionStatus: 'PENDING'
    };

    Deductions.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(expectedDeduction)
    }));

    const result = await createDeduction(params);

    expect(Deductions).toHaveBeenCalledWith({
      employee: 'employeeId',
      corporateUser: 'corporateUserId',
      ...params
    });
    expect(result).toEqual(expectedDeduction);
  });

  it('should handle errors during the creation process', async () => {
    const params = {
      employeeId: 'employeeId',
      corporateUserID: 'corporateUserId',
      deductionAmount: 100,
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionStatus: 'PENDING'
    };

    const errorMessage = 'Failed to create deduction';

    Deductions.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error(errorMessage))
    }));

    await expect(createDeduction(params)).rejects.toThrow('Failed to create deduction');
  });
});
