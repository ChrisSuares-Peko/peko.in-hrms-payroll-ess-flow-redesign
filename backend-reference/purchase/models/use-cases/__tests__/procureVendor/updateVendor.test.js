const { updateVendor } = require('../../procure/procureVendor');

jest.mock('../../../entities/ProcureVendor', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrder', () => ({ count: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('updateVendor', () => {
  const mockVendor = { id: 1, update: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('should call vendor.update with the provided fields', async () => {
    const fields = { businessName: 'Updated Corp', status: 'Inactive' };
    mockVendor.update.mockResolvedValue({ ...mockVendor, ...fields });

    const result = await updateVendor(mockVendor, fields);

    expect(mockVendor.update).toHaveBeenCalledWith(fields);
    expect(result).toMatchObject(fields);
  });

  it('should handle updating a single field like payoutBeneficiaryId', async () => {
    mockVendor.update.mockResolvedValue({ ...mockVendor, payoutBeneficiaryId: 'ben_123' });

    await updateVendor(mockVendor, { payoutBeneficiaryId: 'ben_123' });

    expect(mockVendor.update).toHaveBeenCalledWith({ payoutBeneficiaryId: 'ben_123' });
  });

  it('should throw if vendor.update fails', async () => {
    mockVendor.update.mockRejectedValue(new Error('Update failed'));

    await expect(updateVendor(mockVendor, {})).rejects.toThrow('Update failed');
  });
});
