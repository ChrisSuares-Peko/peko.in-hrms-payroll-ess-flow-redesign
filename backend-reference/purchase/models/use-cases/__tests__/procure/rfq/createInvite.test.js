'use strict';

const RFQVendorInvite = require('../../../../entities/RFQVendorInvite');
const { createInvite } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({ create: jest.fn() }));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('createInvite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return a vendor invite', async () => {
    const mockInvite = { id: 10, rfqId: 'rfq-1', vendorId: 5 };
    RFQVendorInvite.create.mockResolvedValue(mockInvite);

    const result = await createInvite({ rfqId: 'rfq-1', vendorId: 5 });

    expect(RFQVendorInvite.create).toHaveBeenCalledWith({ rfqId: 'rfq-1', vendorId: 5 });
    expect(result).toEqual(mockInvite);
  });

  it('should throw when create rejects', async () => {
    RFQVendorInvite.create.mockRejectedValue(new Error('DB error'));

    await expect(createInvite({ rfqId: 'rfq-1', vendorId: 5 })).rejects.toThrow('DB error');
  });
});
