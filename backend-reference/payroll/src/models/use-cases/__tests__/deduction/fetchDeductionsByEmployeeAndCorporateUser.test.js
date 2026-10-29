const Deductions = require('../../../entities/deductions');
const { fetchDeductionsByEmployeeAndCorporateUser } = require('../../../use-cases/deductions');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/deductions');

describe('fetchDeductionsByEmployeeAndCorporateUser Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return totalDeductionsPay and deductionsIds', async () => {
    const employeeId = new ObjectId().toString();
    const corporateUserId = 'corporateUserId';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');

    const expectedDeductions = [
      { _id: new ObjectId(), deductionAmount: 100 },
      { _id: new ObjectId(), deductionAmount: 200 },
    ];
    const expectedTotalPay = 300;
    const expectedDeductionIds = expectedDeductions.map(item => item._id);

    Deductions.find.mockResolvedValue(expectedDeductions);

    const result = await fetchDeductionsByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

    expect(Deductions.find).toHaveBeenCalledWith({
      employee: new ObjectId(employeeId),
      corporateUser: corporateUserId,
      deductionDate: {
        $gte: cycleStart,
        $lte: cycleEnd
      },
      deductionStatus: 'PENDING'
    }, { deductionAmount: 1, _id: 1 });

    expect(result).toEqual({
      totalDeductionsPay: expectedTotalPay,
      deductionsIds: expectedDeductionIds
    });
  });

  it('should throw an error if the database operation fails', async () => {
    const employeeId = new ObjectId().toHexString();
    const corporateUserId = 'corporateUserId';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');
    const errorMessage = 'Failed to fetch deductions';

    Deductions.find.mockRejectedValue(new Error(errorMessage));

    await expect(fetchDeductionsByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd)).rejects.toThrow(errorMessage);
  });
});
