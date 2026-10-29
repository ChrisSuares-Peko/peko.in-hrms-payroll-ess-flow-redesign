const { uniqueAssets } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets', () => ({
  aggregate: jest.fn(),
}));

describe('uniqueAssets Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return unique assets', async () => {
    const corporateUserID = 'corporateUserID';
    const expectedAssets = [
      { label: 'Laptop', value: 'Laptop', count: 1 },
    ];

    Asset.aggregate.mockResolvedValue(expectedAssets);

    const result = await uniqueAssets(corporateUserID);

    expect(Asset.aggregate).toHaveBeenCalledWith([
      { $match: { corporateUser: corporateUserID } },
      { $group: { _id: "$assetType", count: { $sum: 1 } } },
      { $project: { _id: 0, label: "$_id", value: "$_id" } },
    ]);
    expect(result).toEqual(expectedAssets);
  });

  it('should return an error if the aggregate method throws an error', async () => {
    const corporateUserID = 'corporateUserID';
    const expectedError = new Error('Database error');

    Asset.aggregate.mockRejectedValue(expectedError);

    const result = await uniqueAssets(corporateUserID);

    expect(Asset.aggregate).toHaveBeenCalled();
    expect(result).toBe(expectedError);
  });
});
