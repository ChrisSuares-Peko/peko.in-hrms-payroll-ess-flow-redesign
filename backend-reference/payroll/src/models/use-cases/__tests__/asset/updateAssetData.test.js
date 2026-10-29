const { updateAssetData } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets', () => ({
  findOneAndUpdate: jest.fn(),
}));

describe('updateAssetData Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update and return the asset data', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      assetId: 'assetId',
      assetData: { assetName: 'Updated Laptop' },
    };
    const expectedAsset = { _id: 'assetId', assetName: 'Updated Laptop' };

    Asset.findOneAndUpdate.mockResolvedValue(expectedAsset);

    const result = await updateAssetData(params);

    expect(Asset.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'assetId', corporateUser: 'corporateUserID' },
      { $set: { assetName: 'Updated Laptop' } },
      { new: true }
    );
    expect(result).toEqual(expectedAsset);
  });

  it('should return an error if the update method throws an error', async () => {
    const params = {
      corporateUserID: 'corporateUserID',
      assetId: 'assetId',
      assetData: { assetName: 'Updated Laptop' },
    };
    const expectedError = new Error('Database error');

    Asset.findOneAndUpdate.mockRejectedValue(expectedError);

    const result = await updateAssetData(params);

    expect(Asset.findOneAndUpdate).toHaveBeenCalled();
    expect(result).toBe(expectedError);
  });
});
