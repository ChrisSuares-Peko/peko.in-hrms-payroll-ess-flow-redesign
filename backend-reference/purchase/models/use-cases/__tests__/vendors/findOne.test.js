const { findOne } = require('../../vendors');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
  findOne: jest.fn(),
}));

describe('findOne (vendor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a vendor by vendorCode', async () => {
    const params = { vendorCode: 'VEND123' };
    const mockResult = { id: 1, vendorCode: 'VEND123', name: 'Vendor A' };

    vendor.findOne.mockResolvedValue(mockResult);

    const result = await findOne(params);

    expect(vendor.findOne).toHaveBeenCalledWith({
      where: { vendorCode: params.vendorCode },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findOne fails', async () => {
    const params = { vendorCode: 'VEND123' };
    const error = new Error('DB Error');

    vendor.findOne.mockRejectedValue(error);

    await expect(findOne(params)).rejects.toThrow(error);
  });
});
