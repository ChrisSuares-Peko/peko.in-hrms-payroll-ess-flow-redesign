'use strict';

const { deletePR } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('deletePR', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call pr.destroy and return result', async () => {
    const mockPR = { id: 1, destroy: jest.fn().mockResolvedValue(1) };

    const result = await deletePR({ pr: mockPR });

    expect(mockPR.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(1);
  });

  it('should throw when destroy rejects', async () => {
    const mockPR = { destroy: jest.fn().mockRejectedValue(new Error('DB error')) };

    await expect(deletePR({ pr: mockPR })).rejects.toThrow('DB error');
  });
});
