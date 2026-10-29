'use strict';

const ProcureEmployee = require('../../../../entities/ProcureEmployee');
const { findDuplicateEmployee } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/ProcureEmployee', () => ({ findOne: jest.fn() }));

describe('findDuplicateEmployee', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return employee when a duplicate is found', async () => {
    const mockEmployee = { id: 3, email: 'alice@example.com', corporateUserId: 1 };
    ProcureEmployee.findOne.mockResolvedValue(mockEmployee);

    const duplicateWhere = [{ email: 'alice@example.com' }, { employeeId: 'EMP-001' }];
    const result = await findDuplicateEmployee({ corporateUserId: 1, duplicateWhere });

    expect(ProcureEmployee.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ corporateUserId: 1 }) })
    );
    expect(result).toEqual(mockEmployee);
  });

  it('should return null when no duplicate exists', async () => {
    ProcureEmployee.findOne.mockResolvedValue(null);

    const result = await findDuplicateEmployee({
      corporateUserId: 1,
      duplicateWhere: [{ email: 'new@example.com' }],
    });

    expect(result).toBeNull();
  });

  it('should throw when query rejects', async () => {
    ProcureEmployee.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findDuplicateEmployee({ corporateUserId: 1, duplicateWhere: [] }))
      .rejects.toThrow('DB error');
  });
});
