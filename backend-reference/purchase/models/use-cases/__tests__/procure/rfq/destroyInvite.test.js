'use strict';

const { destroyInvite } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('destroyInvite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call invite.destroy and return result', async () => {
    const mockInvite = { id: 10, destroy: jest.fn().mockResolvedValue(1) };

    const result = await destroyInvite({ invite: mockInvite });

    expect(mockInvite.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
  });

  it('should throw when destroy rejects', async () => {
    const mockInvite = { destroy: jest.fn().mockRejectedValue(new Error('DB error')) };

    await expect(destroyInvite({ invite: mockInvite })).rejects.toThrow('DB error');
  });
});
