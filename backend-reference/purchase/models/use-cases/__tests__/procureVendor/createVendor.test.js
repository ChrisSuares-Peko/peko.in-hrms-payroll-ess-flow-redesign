const { createVendor } = require('../../procure/procureVendor');
const ProcureVendor = require('../../../entities/ProcureVendor');

jest.mock('../../../entities/ProcureVendor', () => ({ create: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('createVendor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return a vendor with the provided fields', async () => {
    const fields = {
      corporateUserId: 1,
      businessName: 'Acme Corp',
      contactPerson: 'John Doe',
      email: 'john@acme.com',
      status: 'Active',
    };
    const mockVendor = { id: 1, ...fields };
    ProcureVendor.create.mockResolvedValue(mockVendor);

    const result = await createVendor(fields);

    expect(ProcureVendor.create).toHaveBeenCalledWith(fields);
    expect(result).toEqual(mockVendor);
  });

  it('should throw if the create fails', async () => {
    ProcureVendor.create.mockRejectedValue(new Error('Validation error'));

    await expect(createVendor({ businessName: 'X' })).rejects.toThrow('Validation error');
  });
});
