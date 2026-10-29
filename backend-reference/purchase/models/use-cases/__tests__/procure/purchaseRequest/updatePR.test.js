'use strict';

const { updatePR } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('updatePR', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call pr.update with provided fields and return result', async () => {
    const fields    = { status: 'Approved', approvedAt: new Date() };
    const mockPR    = { id: 1, update: jest.fn().mockResolvedValue({ id: 1, ...fields }) };

    const result = await updatePR({ pr: mockPR, fields });

    expect(mockPR.update).toHaveBeenCalledWith(fields);
    expect(result).toEqual({ id: 1, ...fields });
  });

  it('should throw when update rejects', async () => {
    const mockPR = { update: jest.fn().mockRejectedValue(new Error('DB error')) };

    await expect(updatePR({ pr: mockPR, fields: { status: 'Rejected' } }))
      .rejects.toThrow('DB error');
  });
});
