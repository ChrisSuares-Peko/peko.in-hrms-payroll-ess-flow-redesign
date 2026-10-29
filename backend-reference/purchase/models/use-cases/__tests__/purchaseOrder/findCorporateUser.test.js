const { findCorporateUser } = require('../../procure/purchaseOrder');
const CorporateUser = require('../../../entities/corporateUser');

jest.mock('../../../entities/PurchaseOrder', () => ({ findOne: jest.fn() }));
jest.mock('../../../entities/PurchaseOrderLineItem', () => ({ bulkCreate: jest.fn() }));
jest.mock('../../../entities/ProcureVendor', () => ({}));
jest.mock('../../../entities/Proposal', () => ({}));
jest.mock('../../../entities/PurchaseRequest', () => ({ update: jest.fn() }));
jest.mock('../../../entities/RFQ', () => ({ findByPk: jest.fn() }));
jest.mock('../../../entities/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../../../configs/database/index', () => ({
  define: jest.fn(),
  transaction: jest.fn((cb) => cb()),
}));

describe('findCorporateUser', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the corporate user with the expected attributes', async () => {
    const mockUser = { id: 1, companyName: 'Peko Ltd', email: 'reach@peko.one' };
    CorporateUser.findOne.mockResolvedValue(mockUser);

    const result = await findCorporateUser(1);

    expect(CorporateUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        attributes: expect.arrayContaining(['id', 'companyName', 'email']),
      })
    );
    expect(result).toEqual(mockUser);
  });

  it('should return null when the corporate user does not exist', async () => {
    CorporateUser.findOne.mockResolvedValue(null);

    const result = await findCorporateUser(999);

    expect(result).toBeNull();
  });

  it('should throw if the query fails', async () => {
    CorporateUser.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findCorporateUser(1)).rejects.toThrow('DB error');
  });
});
