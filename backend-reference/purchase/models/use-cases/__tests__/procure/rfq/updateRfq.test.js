'use strict';

const { updateRfq } = require('../../../procure/rfq');

jest.mock('../../../../entities/RFQ',              () => ({}));
jest.mock('../../../../entities/RFQLineItem',      () => ({}));
jest.mock('../../../../entities/RFQVendorInvite',  () => ({}));
jest.mock('../../../../entities/ProcureVendor',    () => ({}));
jest.mock('../../../../entities/PurchaseRequest',  () => ({}));
jest.mock('../../../../../configs/database/index', () => ({ transaction: jest.fn() }));

describe('updateRfq', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call rfq.update with provided fields and return result', async () => {
    const fields  = { status: 'Closed', closedAt: new Date() };
    const mockRfq = { id: 1, update: jest.fn().mockResolvedValue({ id: 1, ...fields }) };

    const result = await updateRfq({ rfq: mockRfq, fields });

    expect(mockRfq.update).toHaveBeenCalledWith(fields);
    expect(result).toEqual({ id: 1, ...fields });
  });

  it('should throw when update rejects', async () => {
    const mockRfq = { update: jest.fn().mockRejectedValue(new Error('DB error')) };

    await expect(updateRfq({ rfq: mockRfq, fields: { status: 'Closed' } }))
      .rejects.toThrow('DB error');
  });
});
