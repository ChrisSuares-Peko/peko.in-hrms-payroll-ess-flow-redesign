'use strict';

const ProcureVendor = require('../../../../entities/ProcureVendor');
const { findVendor } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('findVendor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return vendor when found', async () => {
    const mockVendor = { id: 5, businessName: 'Acme Corp', corporateUserId: 10 };
    ProcureVendor.findOne.mockResolvedValue(mockVendor);

    const result = await findVendor({ vendorId: 5, corporateUserId: 10 });

    expect(ProcureVendor.findOne).toHaveBeenCalledWith({ where: { id: 5, corporateUserId: 10 } });
    expect(result).toEqual(mockVendor);
  });

  it('should return null when vendor not found', async () => {
    ProcureVendor.findOne.mockResolvedValue(null);

    const result = await findVendor({ vendorId: 99, corporateUserId: 10 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    ProcureVendor.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findVendor({ vendorId: 5, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
