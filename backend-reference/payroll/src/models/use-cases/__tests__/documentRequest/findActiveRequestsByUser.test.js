const { findActiveRequestsByUser } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');

jest.mock('../../../entities/documentRequest', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

describe('findActiveRequestsByUser Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scope the query to the requesting employee with default pagination', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const expectedRecords = [{ _id: 'req1', employee: employeeId, status: 'pending' }];

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue(expectedRecords);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
    DocumentRequest.countDocuments.mockResolvedValue(1);

    const result = await findActiveRequestsByUser(corporateUser, employeeId);

    expect(DocumentRequest.find).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      status: { $in: ['pending', 'in-progress'] },
    });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(skipMock).toHaveBeenCalledWith(0);
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      status: { $in: ['pending', 'in-progress'] },
    });
    expect(result).toEqual({ records: expectedRecords, total: 1 });
  });

  it('should apply from/to date filters and custom pagination', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const from = new Date('2026-01-01');
    const to = new Date('2026-06-30');
    const expectedRecords = [{ _id: 'req2', employee: employeeId, status: 'in-progress' }];

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue(expectedRecords);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
    DocumentRequest.countDocuments.mockResolvedValue(1);

    const result = await findActiveRequestsByUser(corporateUser, employeeId, { from, to, page: 2, limit: 5 });

    const expectedFilter = {
      corporateUser,
      employee: employeeId,
      status: { $in: ['pending', 'in-progress'] },
      createdAt: { $gte: from, $lte: to },
    };
    expect(DocumentRequest.find).toHaveBeenCalledWith(expectedFilter);
    expect(skipMock).toHaveBeenCalledWith(5);
    expect(limitMock).toHaveBeenCalledWith(5);
    expect(DocumentRequest.countDocuments).toHaveBeenCalledWith(expectedFilter);
    expect(result).toEqual({ records: expectedRecords, total: 1 });
  });

  it('should apply only the from filter when to is not provided', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const from = new Date('2026-01-01');

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue([]);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await findActiveRequestsByUser(corporateUser, employeeId, { from });

    expect(DocumentRequest.find).toHaveBeenCalledWith({
      corporateUser,
      employee: employeeId,
      status: { $in: ['pending', 'in-progress'] },
      createdAt: { $gte: from },
    });
  });

  it('should propagate an error if the find method throws an error', async () => {
    const corporateUser = 'corporateUserId';
    const employeeId = 'employeeId';
    const expectedError = new Error('DB failure');

    const sortMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockRejectedValue(expectedError);
    DocumentRequest.find.mockReturnValue({ sort: sortMock, skip: skipMock, limit: limitMock });
    DocumentRequest.countDocuments.mockResolvedValue(0);

    await expect(findActiveRequestsByUser(corporateUser, employeeId)).rejects.toThrow('DB failure');
  });
});
