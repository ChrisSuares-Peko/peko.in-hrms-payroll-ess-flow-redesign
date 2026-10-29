const { findEmployeeAssets } = require('../../assets');
const Asset = require('../../../entities/assets');

jest.mock('../../../entities/assets', () => ({
  find: jest.fn(),
}));

describe('findEmployeeAssets Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return assets for a given employee and corporate user', async () => {
    const params = { employeeId: 'employeeId', corporateUserId: 'corporateUserId' };
    const expectedAssets = [{ _id: 'assetId', assetName: 'Laptop' }];

    Asset.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(expectedAssets)
    });

    const result = await findEmployeeAssets(params);

    expect(Asset.find).toHaveBeenCalledWith({
      employee: params.employeeId,
      corporateUser: params.corporateUserId,
    });
    expect(result).toEqual(expectedAssets);
  });

  it('should throw an error if the find method throws an error', async () => {
    const params = { employeeId: 'employeeId', corporateUserId: 'corporateUserId' };
    const expectedError = new Error('Database error');

    Asset.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(expectedError)
    });

    await expect(findEmployeeAssets(params)).rejects.toThrow('Error fetching employee assets');

    expect(Asset.find).toHaveBeenCalledWith({
      employee: params.employeeId,
      corporateUser: params.corporateUserId,
    });
  });
});
