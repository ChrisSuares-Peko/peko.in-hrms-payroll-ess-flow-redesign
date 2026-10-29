const { createDocumentRequest } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');

jest.mock('../../../entities/documentRequest', () => ({
  create: jest.fn(),
}));

describe('createDocumentRequest Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return a new document request', async () => {
    const data = {
      corporateUser: 'corporateUserId',
      employee: 'employeeId',
      userId: 'userId',
      documentType: 'Salary Certificate',
      purpose: 'Loan application',
      status: 'pending',
    };
    const expectedRequest = {
      _id: 'requestId',
      ...data,
    };

    DocumentRequest.create.mockResolvedValue(expectedRequest);

    const result = await createDocumentRequest(data);

    expect(DocumentRequest.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(expectedRequest);
  });

  it('should propagate an error if the create method throws an error', async () => {
    const data = {
      corporateUser: 'corporateUserId',
      employee: 'employeeId',
      userId: 'userId',
      documentType: 'Bank Letter',
      purpose: 'Visa application',
      status: 'pending',
    };
    const expectedError = new Error('DB failure');

    DocumentRequest.create.mockRejectedValue(expectedError);

    await expect(createDocumentRequest(data)).rejects.toThrow('DB failure');
    expect(DocumentRequest.create).toHaveBeenCalledWith(data);
  });
});
