const { findOpenRequest } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');

jest.mock('../../../entities/documentRequest', () => ({
  findOne: jest.fn(),
}));

describe('findOpenRequest Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query for a pending/in-progress request scoped to corporateUser, employee, and documentType', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const documentType = 'Salary Certificate';
    const expectedRequest = {
      _id: 'requestId',
      corporateUser,
      employee: employeeId,
      documentType,
      status: 'pending',
    };

    DocumentRequest.findOne.mockResolvedValue(expectedRequest);

    const result = await findOpenRequest(corporateUser, employeeId, documentType);

    expect(DocumentRequest.findOne).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      documentType,
      status: { $in: ['pending', 'in-progress'] },
    });
    expect(result).toEqual(expectedRequest);
  });

  it('should return null when there is no open request', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const documentType = 'Bank Letter';

    DocumentRequest.findOne.mockResolvedValue(null);

    const result = await findOpenRequest(corporateUser, employeeId, documentType);

    expect(DocumentRequest.findOne).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      documentType,
      status: { $in: ['pending', 'in-progress'] },
    });
    expect(result).toBeNull();
  });

  it('should propagate an error if the findOne method throws an error', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const documentType = 'Salary Certificate';
    const expectedError = new Error('DB failure');

    DocumentRequest.findOne.mockRejectedValue(expectedError);

    await expect(findOpenRequest(corporateUser, employeeId, documentType)).rejects.toThrow('DB failure');
    expect(DocumentRequest.findOne).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      documentType,
      status: { $in: ['pending', 'in-progress'] },
    });
  });
});
