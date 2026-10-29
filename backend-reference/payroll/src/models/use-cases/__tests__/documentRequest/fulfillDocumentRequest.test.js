const { fulfillDocumentRequest } = require('../../documentRequest');
const DocumentRequest = require('../../../entities/documentRequest');

jest.mock('../../../entities/documentRequest', () => ({
  findOneAndUpdate: jest.fn(),
}));

describe('fulfillDocumentRequest Use-Case', () => {
  const realDate = Date;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.Date = realDate;
  });

  it('should update the request scoped by id and corporateUser, marking it completed', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'requestId';
    const uploadedDocument = {
      name: 'Salary Certificate',
      url: 'https://example.com/doc.pdf',
      format: 'pdf',
      uploadedAt: new Date('2026-07-24T00:00:00.000Z'),
      uploadedBy: corporateUser,
    };
    const remarks = 'Issued as requested';
    const fixedNow = new Date('2026-07-24T10:00:00.000Z');
    global.Date = class extends realDate {
      constructor(...args) {
        if (args.length) {
          return new realDate(...args);
        }
        return fixedNow;
      }
    };

    const expectedUpdated = {
      _id: requestId,
      corporateUser,
      uploadedDocument,
      remarks,
      status: 'completed',
      completedAt: fixedNow,
    };
    DocumentRequest.findOneAndUpdate.mockResolvedValue(expectedUpdated);

    const result = await fulfillDocumentRequest(corporateUser, requestId, { uploadedDocument, remarks });

    expect(DocumentRequest.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: requestId, corporateUser },
      {
        $set: {
          uploadedDocument,
          remarks,
          status: 'completed',
          completedAt: fixedNow,
        },
      },
      { new: true }
    );
    expect(result).toEqual(expectedUpdated);
  });

  it('should return null when no matching request is found for the corporateUser', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'someOtherCorporatesRequestId';
    const uploadedDocument = { name: 'Bank Letter', url: 'https://example.com/bank.pdf', format: 'pdf' };

    DocumentRequest.findOneAndUpdate.mockResolvedValue(null);

    const result = await fulfillDocumentRequest(corporateUser, requestId, { uploadedDocument, remarks: undefined });

    expect(DocumentRequest.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: requestId, corporateUser },
      expect.objectContaining({
        $set: expect.objectContaining({
          uploadedDocument,
          status: 'completed',
        }),
      }),
      { new: true }
    );
    expect(result).toBeNull();
  });

  it('should propagate an error if the findOneAndUpdate method throws an error', async () => {
    const corporateUser = 'corporateUserId';
    const requestId = 'requestId';
    const uploadedDocument = { name: 'Salary Certificate', url: 'https://example.com/doc.pdf', format: 'pdf' };
    const expectedError = new Error('DB failure');

    DocumentRequest.findOneAndUpdate.mockRejectedValue(expectedError);

    await expect(
      fulfillDocumentRequest(corporateUser, requestId, { uploadedDocument, remarks: 'note' })
    ).rejects.toThrow('DB failure');
  });
});
