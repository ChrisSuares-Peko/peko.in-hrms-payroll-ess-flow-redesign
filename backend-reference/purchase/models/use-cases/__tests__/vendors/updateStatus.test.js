const { updateStatus } = require('../../vendors');
const vendor = require('../../../entities/vendor');

jest.mock('../../../entities/vendor', () => ({
  update: jest.fn(),
}));

describe('updateStatus (vendor)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update vendor status successfully', async () => {
    const req = {
      params: { id: 1 },
      body: { status: 'ACTIVE' },
    };

    const mockResult = [1];
    vendor.update.mockResolvedValue(mockResult);

    const result = await updateStatus(req);

    expect(vendor.update).toHaveBeenCalledWith(req.body, {
      where: { id: req.params.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if update fails', async () => {
    const req = {
      params: { id: 1 },
      body: { status: 'INACTIVE' },
    };
    const error = new Error('DB Error');

    vendor.update.mockRejectedValue(error);

    await expect(updateStatus(req)).rejects.toThrow(error);
  });
});
