'use strict';

const ProcureEmployee = require('../../../../entities/ProcureEmployee');
const { listLocalEmployees } = require('../../../procure/purchaseRequest');

jest.mock('../../../../entities/PurchaseRequest', () => ({}));
jest.mock('../../../../entities/ProcureEmployee', () => ({ findAll: jest.fn() }));

describe('listLocalEmployees', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all employees for a corporate user', async () => {
    const mockEmployees = [
      { id: 1, name: 'Alice', status: 'Active' },
      { id: 2, name: 'Bob',   status: 'Active' },
    ];
    ProcureEmployee.findAll.mockResolvedValue(mockEmployees);

    const result = await listLocalEmployees({ corporateUserId: 1, status: null });

    expect(ProcureEmployee.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1 } })
    );
    expect(result).toEqual(mockEmployees);
  });

  it('should filter by status when provided', async () => {
    ProcureEmployee.findAll.mockResolvedValue([]);

    await listLocalEmployees({ corporateUserId: 1, status: 'Inactive' });

    expect(ProcureEmployee.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { corporateUserId: 1, status: 'Inactive' } })
    );
  });

  it('should return empty array when no employees exist', async () => {
    ProcureEmployee.findAll.mockResolvedValue([]);

    const result = await listLocalEmployees({ corporateUserId: 1, status: null });

    expect(result).toEqual([]);
  });

  it('should throw when query rejects', async () => {
    ProcureEmployee.findAll.mockRejectedValue(new Error('DB error'));

    await expect(listLocalEmployees({ corporateUserId: 1, status: null })).rejects.toThrow('DB error');
  });
});
