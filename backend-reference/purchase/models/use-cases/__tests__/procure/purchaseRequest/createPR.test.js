'use strict';

const PurchaseRequest = require('../../../../entities/PurchaseRequest');
const { createPR } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({ create: jest.fn() }));
jest.mock('../../../../entities/ProcureEmployee', () => ({}));

describe('createPR', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create and return a purchase request', async () => {
    const data = {
      corporateUserId: 1, refNumber: 'PR-001', title: 'Office Supplies',
      requestedBy: 'John', department: 'Finance', category: 'Supplies',
      estimatedBudget: 5000, currency: 'INR', status: 'Draft',
    };
    const mockPR = { id: 1, ...data };
    PurchaseRequest.create.mockResolvedValue(mockPR);

    const result = await createPR(data);

    expect(PurchaseRequest.create).toHaveBeenCalledWith(data);
    expect(result).toEqual(mockPR);
  });

  it('should throw when create rejects', async () => {
    PurchaseRequest.create.mockRejectedValue(new Error('DB error'));

    await expect(createPR({ corporateUserId: 1 })).rejects.toThrow('DB error');
  });
});
