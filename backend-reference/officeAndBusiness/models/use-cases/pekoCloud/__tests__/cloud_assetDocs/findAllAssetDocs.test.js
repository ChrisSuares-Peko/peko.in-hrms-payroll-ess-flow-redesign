const { findAllAssetDocs } = require('../../cloud_assetDocs');
const cloud_documents = require('../../../../entities/pekoCloud/cloud_documents');

jest.mock('../../../../entities/pekoCloud/cloud_assets.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeBooks.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_chequeLeaves.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_documents.js', () => ({
  belongsTo: jest.fn(),
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_employees.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_fleets.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_maintenances.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_owners.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_softwares.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_subscriptions.js', () => ({
  belongsTo: jest.fn(),
}));
jest.mock('../../../../entities/pekoCloud/cloud_usageHistories.js', () => ({
  belongsTo: jest.fn(),
}));

describe('findAllAssetDocs Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return existing documents', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'id';
    const sort = 'ASC';
    const searchText = '';
    const assetId = 1;
    const category = 'ASSET'; // Add category since it is used in the function

    const mockAssetDocs = {
      rows: [
        {
          id: '1',
          documentName: 'test document',
          documentNumber: '012345678',
          documentCategory: 'ASSET',
          documentType: 'test type',
          issueDate: '2024-08-05T14:30:00',
          expireDate: '2024-08-05T14:30:00',
          document: 'test document file copy',
          cloudAssetId: 1,
        },
        {
          id: '2',
          documentName: 'test document',
          documentNumber: '012345678',
          documentCategory: 'ASSET',
          documentType: 'test type',
          issueDate: '2024-08-05T14:30:00',
          expireDate: '2024-08-05T14:30:00',
          document: 'test document file copy',
          cloudAssetId: 1,
        }
      ],
      count: 2
    };

    cloud_documents.findAndCountAll.mockResolvedValue(mockAssetDocs);

    const result = await findAllAssetDocs(page, itemsPerPage, sortField, sort, searchText, assetId);

    expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        cloudAssetId: assetId,
        documentCategory: category,
      },
    });

    expect(result).toEqual({ success: true, data: mockAssetDocs });
  });

  it('should handle errors from findAndCountAll', async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = 'id';
    const sort = 'ASC';
    const searchText = '';
    const assetId = 1;
  
    cloud_documents.findAndCountAll.mockRejectedValue(new Error('Database error'));
  
    const result = await findAllAssetDocs(page, itemsPerPage, sortField, sort, searchText, assetId);
  
    expect(cloud_documents.findAndCountAll).toHaveBeenCalledWith({
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        cloudAssetId: assetId,
        documentCategory: 'ASSET',
      },
    });
  
    expect(result).toEqual({ success: false, error: 'Database error' });
  });
  
});
