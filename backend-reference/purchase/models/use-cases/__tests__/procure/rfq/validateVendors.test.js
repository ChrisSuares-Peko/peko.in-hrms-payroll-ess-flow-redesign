'use strict';

const ProcureVendor = require('../../../../entities/ProcureVendor');
const { validateVendors } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({ findAll: jest.fn() }));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('validateVendors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return vendors matching the given IDs and corporateUserId', async () => {
    const mockVendors = [{ id: 1 }, { id: 2 }];
    ProcureVendor.findAll.mockResolvedValue(mockVendors);

    const result = await validateVendors({ vendorIds: [1, 2], corporateUserId: 10 });

    expect(ProcureVendor.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ corporateUserId: 10 }) })
    );
    expect(result).toEqual(mockVendors);
  });

  it('should return subset when some vendor IDs are invalid', async () => {
    ProcureVendor.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await validateVendors({ vendorIds: [1, 99], corporateUserId: 10 });

    expect(result).toHaveLength(1);
  });

  it('should return empty array when no vendors found', async () => {
    ProcureVendor.findAll.mockResolvedValue([]);

    const result = await validateVendors({ vendorIds: [99, 100], corporateUserId: 10 });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    ProcureVendor.findAll.mockRejectedValue(new Error('DB error'));

    await expect(validateVendors({ vendorIds: [1], corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
