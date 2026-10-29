const Deductions = require('../../../entities/deductions');
const { deleteDeduction } = require('../../../use-cases/deductions');

jest.mock('../../../entities/deductions');

describe('deleteDeduction Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the deduction successfully', async () => {
    const deductionId = 'deductionId';
    const corporateUserID = 'corporateUserId';
    const employeeId = 'employeeId';
    const expectedDeduction = {
      _id: deductionId,
      deductionStatus: 'PENDING'
    };

    Deductions.findOne.mockResolvedValue(expectedDeduction);
    Deductions.findByIdAndDelete.mockResolvedValue(expectedDeduction);

    const result = await deleteDeduction(deductionId, corporateUserID, employeeId);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: employeeId,
      corporateUser: corporateUserID,
    });
    expect(Deductions.findByIdAndDelete).toHaveBeenCalledWith(deductionId);
    expect(result).toEqual({
      status: true,
      message: 'Deduction deleted successfully',
      deletedDeduction: expectedDeduction
    });
  });

  it('should return an error if deduction not found', async () => {
    const deductionId = 'deductionId';
    const corporateUserID = 'corporateUserId';
    const employeeId = 'employeeId';

    Deductions.findOne.mockResolvedValue(null);

    const result = await deleteDeduction(deductionId, corporateUserID, employeeId);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: employeeId,
      corporateUser: corporateUserID,
    });
    expect(result).toEqual({
      status: false,
      message: 'Deduction not found'
    });
  });

  it('should return an error if deduction has already been processed', async () => {
    const deductionId = 'deductionId';
    const corporateUserID = 'corporateUserId';
    const employeeId = 'employeeId';
    const expectedDeduction = {
      _id: deductionId,
      deductionStatus: 'DEDUCTED'
    };

    Deductions.findOne.mockResolvedValue(expectedDeduction);

    const result = await deleteDeduction(deductionId, corporateUserID, employeeId);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: employeeId,
      corporateUser: corporateUserID,
    });
    expect(result).toEqual({
      status: false,
      message: 'Deduction has already been processed and cannot be deleted'
    });
  });

  it('should handle errors during the deletion process', async () => {
    const deductionId = 'deductionId';
    const corporateUserID = 'corporateUserId';
    const employeeId = 'employeeId';
    const errorMessage = 'Failed to delete deduction';

    console.log = jest.fn();
    Deductions.findOne.mockRejectedValue(new Error(errorMessage));

    const result = await deleteDeduction(deductionId, corporateUserID, employeeId);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: employeeId,
      corporateUser: corporateUserID,
    });
    expect(result).toEqual({
      status: false,
      message: 'Failed to delete deduction due to an error'
    });
  });
});
