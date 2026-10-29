const Deductions = require('../../../entities/deductions');
const { updateDeduction } = require('../../deductions');

jest.mock('../../../entities/deductions');

describe('updateDeduction', () => {
  it('should update and return the deduction if it exists and is not deducted', async () => {
    const deductionId = 'deductionId';
    const updateParams = {
      employeeId: '2',
      corporateUserID: '1',
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionAmount: 100,
    };
    const deduction = {
      save: jest.fn().mockResolvedValue({ ...updateParams, _id: deductionId }),
    };

    Deductions.findOne.mockResolvedValue(deduction);

    const result = await updateDeduction(deductionId, updateParams);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: updateParams.employeeId,
      corporateUser: updateParams.corporateUserID,
    });
    expect(deduction.save).toHaveBeenCalled();
    expect(result).toEqual({ status: true, updated: { ...updateParams, _id: deductionId } });
  });

  it('should return an error if the deduction is already deducted', async () => {
    const deductionId = 'deductionId';
    const updateParams = {
      employeeId: '2',
      corporateUserID: '1',
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionAmount: 100,
    };
    const deduction = { deductionStatus: 'DEDUCTED' };

    Deductions.findOne.mockResolvedValue(deduction);

    const result = await updateDeduction(deductionId, updateParams);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: updateParams.employeeId,
      corporateUser: updateParams.corporateUserID,
    });
    expect(result).toEqual({ status: false, message: 'This deduction has already been processed' });
  });

  it('should return an error if the deduction is not found', async () => {
    const deductionId = 'deductionId';
    const updateParams = {
      employeeId: '2',
      corporateUserID: '1',
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionAmount: 100,
    };

    Deductions.findOne.mockResolvedValue(null);

    const result = await updateDeduction(deductionId, updateParams);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: updateParams.employeeId,
      corporateUser: updateParams.corporateUserID,
    });
    expect(result).toEqual({ status: false, message: 'Deduction not found' });
  });

  it('should return an error if the database operation fails', async () => {
    const deductionId = 'deductionId';
    const updateParams = {
      employeeId: '2',
      corporateUserID: '1',
      deductionDate: new Date(),
      deductionType: 'Type',
      deductionAmount: 100,
    };
    const errorMessage = 'Something went wrong while updating deduction details';

    console.log = jest.fn();
    Deductions.findOne.mockRejectedValue(new Error(errorMessage));

    const result = await updateDeduction(deductionId, updateParams);

    expect(Deductions.findOne).toHaveBeenCalledWith({
      _id: deductionId,
      employee: updateParams.employeeId,
      corporateUser: updateParams.corporateUserID,
    });
    expect(result).toEqual({ status: false, message: errorMessage });
  });
});
