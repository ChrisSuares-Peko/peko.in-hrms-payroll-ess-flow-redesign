const mongoose = require('mongoose');
const { createAssetData } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets');

describe('createAssetData Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and return new asset data', async () => {
    const params = {
      corporateUserID: '160',
      assetData: {
        assetName: 'HP',
        assetId: '12',
        purchasedDate: new Date('2024-04-17T00:00:00.000+00:00'),
        assetType: 'Laptop',
        status: 'ACTIVE',
        employee: new mongoose.Types.ObjectId('65e8835960e2faf13e8faace'),
        batchNo: 'abc123'
      }
    };

    const expectedAsset = {
      _id: new mongoose.Types.ObjectId('6615203aa598dfc03f67a46d'),
      ...params.assetData,
      corporateUser: '160',
      createdAt: new Date('2024-04-09T11:02:18.617+00:00'),
      updatedAt: new Date('2024-04-09T11:02:18.617+00:00')
    };

   
    Asset.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(expectedAsset),
    }));

    const result = await createAssetData(params);

    expect(Asset).toHaveBeenCalledWith({
      corporateUser: '160',
      ...params.assetData,
    });
    expect(result).toEqual(expectedAsset);
  });

  it('should return an error if the save method throws an error', async () => {
    const params = {
      corporateUserID: '160',
      assetData: {
        assetName: 'HP',
        assetId: '12',
        purchasedDate: new Date('2024-04-17T00:00:00.000+00:00'),
        assetType: 'Laptop',
        status: 'ACTIVE',
        employee: new mongoose.Types.ObjectId('65e8835960e2faf13e8faace'),
        batchNo: 'abc123'
      }
    };
    const expectedError = new Error('Error occured while adding asset. Please try again');

    
    Asset.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(expectedError),
    }));

    await expect(createAssetData(params)).rejects.toThrow('Error occured while adding asset. Please try again');

    expect(Asset).toHaveBeenCalledWith({
      corporateUser: '160',
      ...params.assetData,
    });
  });
});
