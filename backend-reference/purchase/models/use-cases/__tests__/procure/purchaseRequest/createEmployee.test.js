'use strict';

const ProcureEmployee = require('../../../../entities/ProcureEmployee');
const { createEmployee } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/ProcureEmployee', () => ({ create: jest.fn() }));

describe('createEmployee', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create employee with corporateUserId merged into payload', async () => {
    const payload = { name: 'Alice', email: 'alice@example.com', employeeId: 'EMP-001' };
    const mockEmployee = { id: 1, corporateUserId: 10, ...payload };
    ProcureEmployee.create.mockResolvedValue(mockEmployee);

    const result = await createEmployee({ corporateUserId: 10, payload });

    expect(ProcureEmployee.create).toHaveBeenCalledWith({ corporateUserId: 10, ...payload });
    expect(result).toEqual(mockEmployee);
  });

  it('should throw when create rejects', async () => {
    ProcureEmployee.create.mockRejectedValue(new Error('DB error'));

    await expect(createEmployee({ corporateUserId: 10, payload: { name: 'Bob' } }))
      .rejects.toThrow('DB error');
  });
});
