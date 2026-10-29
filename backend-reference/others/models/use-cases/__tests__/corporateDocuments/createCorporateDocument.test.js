
const corporateDocuments = require('../../../entities/corporateDocuments');
const { createCorporateDocument } = require('../../corporateDocuments');

jest.mock('../../../entities/corporateDocuments', () => ({
    upsert: jest.fn(),
}));

describe('createCorporateDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upsert corporate document with all provided fields', async () => {
    const params = {
      documentName: "PAN CARD",
      corporateUserId: 10,
      document: "FILE_DATA",
      documentType: "IMAGE",
      expiryDate: "2025-01-01"
    };

    const mockResponse = { success: true };
    corporateDocuments.upsert.mockResolvedValue(mockResponse);

    const result = await createCorporateDocument(params);

    expect(corporateDocuments.upsert).toHaveBeenCalledWith({
      documentName: params.documentName,
      corporateUserId: params.corporateUserId,
      document: params.document,
      documentType: params.documentType,
      expiryDate: params.expiryDate,
      status: "UPLOADED"
    });

    expect(result).toBe(mockResponse);
  });
  it('should set expiryDate to null when not provided', async () => {
    const params = {
      documentName: "GST Certificate",
      corporateUserId: 5,
      document: "FILE_BYTES",
      documentType: "PDF"
      // no expiryDate
    };

    const mockResponse = { updated: true };
    corporateDocuments.upsert.mockResolvedValue(mockResponse);

    const result = await createCorporateDocument(params);

    expect(corporateDocuments.upsert).toHaveBeenCalledWith({
      documentName: params.documentName,
      corporateUserId: params.corporateUserId,
      document: params.document,
      documentType: params.documentType,
      expiryDate: null,
      status: "UPLOADED"
    });

    expect(result).toBe(mockResponse);
  });
  it('should ignore extra fields not used by upsert', async () => {
    const params = {
      documentName: "MOA",
      corporateUserId: 22,
      document: "BYTES",
      documentType: "PDF",
      extraField: "SHOULD_NOT_BE_SENT"
    };

    corporateDocuments.upsert.mockResolvedValue("OK");

    await createCorporateDocument(params);

    expect(corporateDocuments.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        documentName: params.documentName,
        corporateUserId: params.corporateUserId,
        document: params.document,
        documentType: params.documentType,
        status: "UPLOADED"
      })
    );

    // ensure extra field NOT passed
    expect(corporateDocuments.upsert.mock.calls[0][0].extraField).toBeUndefined();
  });

  it('should handle optional fields gracefully', async () => {
    const params = {
      documentName: "AOA",
      corporateUserId: 60,
      documentType: "PDF"
      // missing document, expiryDate
    };

    corporateDocuments.upsert.mockResolvedValue("DONE");

    await createCorporateDocument(params);

    expect(corporateDocuments.upsert).toHaveBeenCalledWith({
      documentName: params.documentName,
      corporateUserId: params.corporateUserId,
      document: undefined,
      documentType: params.documentType,
      expiryDate: null,
      status: "UPLOADED"
    });
  });

  it('should throw an error when upsert fails', async () => {
    const error = new Error("DB failed");
    corporateDocuments.upsert.mockRejectedValue(error);

    await expect(
      createCorporateDocument({
        documentName: "Contract",
        corporateUserId: 1,
        documentType: "PDF"
      })
    ).rejects.toThrow("DB failed");
  });

});
