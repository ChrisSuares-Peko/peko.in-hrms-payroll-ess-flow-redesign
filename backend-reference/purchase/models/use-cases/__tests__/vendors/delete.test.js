const { Delete } = require('../../vendors');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
  destroy: jest.fn(),
}));

describe('Delete (vendor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a vendor by vendorCode', async () => {
    const params = { vendorCode: 'VEND123' };

 
    vendor.destroy.mockResolvedValue(1);

    const result = await Delete(params);

    expect(vendor.destroy).toHaveBeenCalledWith({
      where: { vendorCode: params.vendorCode },
    });

    expect(result).toBe(1);
  });

  it('should throw an error if destroy fails', async () => {
    const params = { vendorCode: 'VEND123' };
    const error = new Error('DB Error');

    vendor.destroy.mockRejectedValue(error);

    await expect(Delete(params)).rejects.toThrow(error);
  });
});
