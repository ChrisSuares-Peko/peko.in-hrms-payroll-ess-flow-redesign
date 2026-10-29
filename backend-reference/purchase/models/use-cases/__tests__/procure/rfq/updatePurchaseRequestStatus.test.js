'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const { updatePurchaseRequestStatus } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({ update: jest.fn() }));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('updatePurchaseRequestStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should update PR status to Converted to RFQ', async () => {
    PurchaseRequest.update.mockResolvedValue([1]);

    const result = await updatePurchaseRequestStatus({ purchaseRequestId: 3, corporateUserId: 1, rfqId: 'rfq-1' });

    expect(PurchaseRequest.update).toHaveBeenCalledWith(
      { status: 'Converted to RFQ', rfqId: 'rfq-1' },
      { where: { id: 3, corporateUserId: 1 } }
    );
    expect(result).toEqual([1]);
  });

  it('should return [0] when PR not found', async () => {
    PurchaseRequest.update.mockResolvedValue([0]);

    const result = await updatePurchaseRequestStatus({ purchaseRequestId: 99, corporateUserId: 1, rfqId: 'rfq-1' });

    expect(result).toEqual([0]);
  });

  it('should throw when query rejects', async () => {
    PurchaseRequest.update.mockRejectedValue(new Error('DB error'));

    await expect(updatePurchaseRequestStatus({ purchaseRequestId: 3, corporateUserId: 1, rfqId: 'rfq-1' }))
      .rejects.toThrow('DB error');
  });
});
