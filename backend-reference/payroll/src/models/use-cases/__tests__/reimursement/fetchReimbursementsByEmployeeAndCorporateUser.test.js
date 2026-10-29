const Reimbursement = require('../../../entities/reimbursement');
const { fetchReimbursementsByEmployeeAndCorporateUser } = require('../../../use-cases/reimbursement');
const { ObjectId } = require('mongoose').Types;

jest.mock('../../../entities/reimbursement');

describe('fetchReimbursementsByEmployeeAndCorporateUser Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return reimbursements, totalReimbursementsPay, and reimbursementIds', async () => {
    const employeeId = new ObjectId().toString();
    const corporateUserId = 'corporateUserId';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');

    const expectedReimbursements = [
      { _id: new ObjectId(), totalPay: 100 },
      { _id: new ObjectId(), totalPay: 200 },
    ];
    const expectedTotalPay = 300;
    const expectedReimbursementIds = expectedReimbursements.map(item => item._id);

    Reimbursement.find.mockResolvedValue(expectedReimbursements);

    const result = await fetchReimbursementsByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd);

    expect(Reimbursement.find).toHaveBeenCalledWith({
      employee: new ObjectId(employeeId),
      corporateUser: corporateUserId,
      expenseDate: {
        $gte: cycleStart,
        $lte: cycleEnd
      },
      transferMethod: 'SALARY',
      paymentStatus: { $in: ['UNPAID', 'APPROVED'] },
      status: { $ne: 'requestedByEmployee' }
    });

    expect(result).toEqual({
      reimbursements: expectedReimbursements,
      totalReimbursementsPay: expectedTotalPay,
      reimbursementIds: expectedReimbursementIds
    });
  });

  it('should throw an error if the database operation fails', async () => {
    const employeeId = new ObjectId().toHexString();
    const corporateUserId = 'corporateUserId';
    const cycleStart = new Date('2023-01-01');
    const cycleEnd = new Date('2023-12-31');
    const errorMessage = 'Failed to fetch the reimbursement';

    Reimbursement.find.mockRejectedValue(new Error(errorMessage));

    await expect(fetchReimbursementsByEmployeeAndCorporateUser(employeeId, corporateUserId, cycleStart, cycleEnd)).rejects.toThrow('Failed to fetch the reimbursement');
  });
});
