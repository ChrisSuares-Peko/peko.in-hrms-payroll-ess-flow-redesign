const Deductions = require('../../../entities/deductions');
const { findDuplicateDeduction } = require('../../../use-cases/deductions');

jest.mock('../../../entities/deductions');

describe('findDuplicateDeduction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should return the deduction if it exists', async () => {
    const params = { corporateUserID: '1', employeeId: '2' };
    const otherParams = { deductionType: 'TAX' };
    const expectedDeduction = { _id: 'deductionId' };

    Deductions.findOne.mockResolvedValue(expectedDeduction);

    const result = await findDuplicateDeduction({ ...params, ...otherParams });

    expect(Deductions.findOne).toHaveBeenCalledWith({
      corporateUser: '1',
      employee: '2',
      deductionType: 'TAX'
    });
    expect(result).toEqual(expectedDeduction);
  });

  it('should return false if no deduction exists', async () => {
    const params = { corporateUserID: '1', employeeId: '2' };
    const otherParams = { deductionType: 'TAX' };

    Deductions.findOne.mockResolvedValue(null);

    const result = await findDuplicateDeduction({ ...params, ...otherParams });

    expect(Deductions.findOne).toHaveBeenCalledWith({
      corporateUser: '1',
      employee: '2',
      deductionType: 'TAX'
    });
    expect(result).toBe(false);
  });

  it('should throw an error if the database operation fails', async () => {
    const params = { corporateUserID: '1', employeeId: '2' };
    const otherParams = { deductionType: 'TAX' };
    const errorMessage = 'Failed to find deduction';

    Deductions.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(findDuplicateDeduction({ ...params, ...otherParams })).rejects.toThrow('Failed to find deduction');
  });
});
