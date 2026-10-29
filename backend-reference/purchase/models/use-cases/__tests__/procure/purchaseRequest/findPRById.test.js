'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const { findPRById } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({ findOne: jest.fn() }));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('findPRById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return PR when found', async () => {
    const mockPR = { id: 1, corporateUserId: 10, title: 'Test PR' };
    PurchaseRequest.findOne.mockResolvedValue(mockPR);

    const result = await findPRById({ id: 1, corporateUserId: 10 });

    expect(PurchaseRequest.findOne).toHaveBeenCalledWith({ where: { id: 1, corporateUserId: 10 } });
    expect(result).toEqual(mockPR);
  });

  it('should return null when PR not found', async () => {
    PurchaseRequest.findOne.mockResolvedValue(null);

    const result = await findPRById({ id: 99, corporateUserId: 10 });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    PurchaseRequest.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findPRById({ id: 1, corporateUserId: 10 })).rejects.toThrow('DB error');
  });
});
