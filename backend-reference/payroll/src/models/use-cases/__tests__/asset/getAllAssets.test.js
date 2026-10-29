const { getAllAssets } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets');

describe('getAllAssets Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  it('should return all assets with pagination', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      assetType: '',
      status: '',
    };
    const expectedAssets = [{ _id: 'assetId', assetName: 'Laptop' }];
    const expectedTotalCount = 1;

    Asset.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(expectedAssets),
    }));
    Asset.countDocuments.mockResolvedValue(expectedTotalCount);

    const result = await getAllAssets(params);

    expect(Asset.find).toHaveBeenCalledWith(expect.any(Object));
    expect(Asset.countDocuments).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual({
      totalCount: expectedTotalCount,
      assetData: expectedAssets,
    });
  });

  it('should return an error if find or countDocuments method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      page: 1,
      limit: 10,
      searchText: '',
      assetType: '',
      status: '',
    };
    const expectedError = new Error('Database error');

    Asset.find.mockImplementation(() => ({
      populate: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(expectedError),
    }));
    Asset.countDocuments.mockRejectedValue(expectedError);

    const result = await getAllAssets(params);

    expect(result).toBe(expectedError);
  });
});
