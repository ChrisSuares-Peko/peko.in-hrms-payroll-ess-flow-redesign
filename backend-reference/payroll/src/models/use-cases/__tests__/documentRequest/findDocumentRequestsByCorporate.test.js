const { findDocumentRequestsByCorporate } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');
const Employee = require('../../../entities/employee');

jest.mock('../../../entities/documentRequest', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../../entities/employee', () => ({
  find: jest.fn(),
}));

describe('findDocumentRequestsByCorporate Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should query with default pagination and no status/search filters', async () => {
    const corporateUser = 'corporateUserId';
    const expectedRecords = [{ _id: 'req1', corporateUser }];

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue(expectedRecords);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock, populate: populateMock });
    DocumentRequest.countDocuments.mockResolvedValue(1);

    const result = await findDocumentRequestsByCorporate(corporateUser);

    expect(DocumentRequest.find).toHaveBeenCalledWith({ corporateUser });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(skipMock).toHaveBeenCalledWith(0);
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(populateMock).toHaveBeenCalledWith(
      'employee',
      'personalInformation.fullName employeeInformation.employeeId'
    );
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith({ corporateUser });
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith({ corporateUser, status: 'pending' });
    expect(Employee.find).not.toHaveBeenCalled();
    expect(result).toEqual({ records: expectedRecords, total: 1, pendingCount: 1 });
  });

  it('should apply the status filter when status is not "all"', async () => {
    const corporateUser = 'corporateUserId';

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue([]);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock, populate: populateMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await findDocumentRequestsByCorporate(corporateUser, { status: 'pending', page: 2, limit: 20 });

    expect(DocumentRequest.find).toHaveBeenCalledWith({ corporateUser, status: 'pending' });
    expect(skipMock).toHaveBeenCalledWith(20);
    expect(limitMock).toHaveBeenCalledWith(20);
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith({ corporateUser, status: 'pending' });
  });

  it('should not apply a status filter when status is "all"', async () => {
    const corporateUser = 'corporateUserId';

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue([]);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock, populate: populateMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await findDocumentRequestsByCorporate(corporateUser, { status: 'all' });

    expect(DocumentRequest.find).toHaveBeenCalledWith({ corporateUser });
  });

  it('should build a search filter matching employee name, documentType, or status', async () => {
    const corporateUser = 'corporateUserId';
    const searchText = 'john';
    const matchingEmployees = [{ _id: 'emp1' }, { _id: 'emp2' }];

    Employee.find.mockReturnValue({ select: jest.fn().mockResolvedValue(matchingEmployees) });

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockResolvedValue([]);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock, populate: populateMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await findDocumentRequestsByCorporate(corporateUser, { searchText });

    expect(Employee.find).toHaveBeenCalledWith({
      corporateUser,
      'personalInformation.fullName': new RegExp(searchText, 'i'),
    });

    const expectedFilter = {
      corporateUser,
      $or: [
        { employee: { $in: ['emp1', 'emp2'] } },
        { documentType: new RegExp(searchText, 'i') },
        { status: new RegExp(searchText, 'i') },
      ],
    };
    expect(DocumentRequest.find).toHaveBeenCalledWith(expectedFilter);
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith(expectedFilter);
  });

  it('should propagate an error if the find method throws an error', async () => {
    const corporateUser = 'corporateUserId';
    const expectedError = new Error('DB failure');

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const populateMock = jest.fn().mockRejectedValue(expectedError);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock, populate: populateMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await expect(findDocumentRequestsByCorporate(corporateUser)).rejects.toThrow('DB failure');
  });
});
