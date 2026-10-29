
const corporateDocuments = require('../../../entities/corporateDocuments');
const { findAllCorporateDocuments } = require('../../corporateDocuments');
const { Op } = require('sequelize');

jest.mock('../../../entities/corporateDocuments', () => ({
  findAll: jest.fn(),
}));

describe('findAllCorporateDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all corporate documents with the correct filters', async () => {
    const params = {
      corporateUserId: 10,
      documentNames: ['PAN', 'GST']
    };

    const mockResponse = [
      { id: 1, documentName: 'PAN' },
      { id: 2, documentName: 'GST' }
    ];

    corporateDocuments.findAll.mockResolvedValue(mockResponse);

    const result = await findAllCorporateDocuments(params);

    expect(corporateDocuments.findAll).toHaveBeenCalledWith({
      where: {
        corporateUserId: params.corporateUserId,
        documentName: { [Op.in]: params.documentNames }
      },
      attributes: ['id', 'documentName', 'document', 'documentType', 'corporateUserId', 'status', 'expiryDate'],
      raw: true,
      nest: true
    });

    expect(result).toBe(mockResponse);
  });

  it('should return empty array when no documents exist', async () => {
    const params = {
      corporateUserId: 5,
      documentNames: ['UNKNOWN']
    };

    corporateDocuments.findAll.mockResolvedValue([]);

    const result = await findAllCorporateDocuments(params);

    expect(result).toEqual([]);
  });

  it('should handle empty documentNames array', async () => {
    const params = {
      corporateUserId: 3,
      documentNames: []
    };

    const mockResponse = [];

    corporateDocuments.findAll.mockResolvedValue(mockResponse);

    const result = await findAllCorporateDocuments(params);

    expect(corporateDocuments.findAll).toHaveBeenCalledWith({
      where: {
        corporateUserId: params.corporateUserId,
        documentName: { [Op.in]: [] }
      },
      attributes: ['id', 'documentName', 'document', 'documentType', 'corporateUserId', 'status', 'expiryDate'],
      raw: true,
      nest: true
    });

    expect(result).toBe(mockResponse);
  });


  it('should throw an error when findAll fails', async () => {
    const params = {
      corporateUserId: 7,
      documentNames: ['PAN']
    };

    const error = new Error("DB error");
    corporateDocuments.findAll.mockRejectedValue(error);

    await expect(findAllCorporateDocuments(params)).rejects.toThrow("DB error");
  });

  it('should throw when params is undefined', async () => {
    await expect(findAllCorporateDocuments(undefined)).rejects.toThrow();
  });

  it('should throw when corporateUserId is missing', async () => {
    await expect(findAllCorporateDocuments({ documentNames: ['PAN'] })).rejects.toThrow();
  });


});
