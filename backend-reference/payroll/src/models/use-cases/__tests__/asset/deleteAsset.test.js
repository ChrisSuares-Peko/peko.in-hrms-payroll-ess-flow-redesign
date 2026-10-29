const { deleteAsset } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets', () => ({
  findOneAndDelete: jest.fn(),
}));

describe('deleteAsset Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete and return the asset data', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      assetId: 'assetId',
    };
    const expectedAsset = { _id: 'assetId', assetName: 'Laptop' };

    Asset.findOneAndDelete.mockResolvedValue(expectedAsset);

    const result = await deleteAsset(params);

    expect(Asset.findOneAndDelete).toHaveBeenCalledWith({
      _id: 'assetId',
      corporateUser: 'corporateUserID',
    });
    expect(result).toEqual(expectedAsset);
  });

  it('should return an error if the delete method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      assetId: 'assetId',
    };
    const expectedError = new Error('Database error');

    Asset.findOneAndDelete.mockRejectedValue(expectedError);

    const result = await deleteAsset(params);

    expect(Asset.findOneAndDelete).toHaveBeenCalled();
    expect(result).toBe(expectedError);
  });
});
