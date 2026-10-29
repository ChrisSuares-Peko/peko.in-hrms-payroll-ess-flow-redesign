'use strict';

const { deleteRfq } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('deleteRfq', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call rfq.destroy and return result', async () => {
    const mockRfq = { id: 1, destroy: jest.fn().mockResolvedValue(1) };

    const result = await deleteRfq({ rfq: mockRfq });

    expect(mockRfq.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
  });

  it('should throw when destroy rejects', async () => {
    const mockRfq = { destroy: jest.fn().mockRejectedValue(new Error('DB error')) };

    await expect(deleteRfq({ rfq: mockRfq })).rejects.toThrow('DB error');
  });
});
