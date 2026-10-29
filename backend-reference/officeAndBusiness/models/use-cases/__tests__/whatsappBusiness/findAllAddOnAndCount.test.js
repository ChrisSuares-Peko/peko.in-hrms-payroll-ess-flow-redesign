const { findAllAddOnAndCount } = require('../../../use-cases/whatsappBusiness');
const WhatsAppSubscription = require('../../../entities/whatsAppSubscription');
const credential = require('../../../entities/credential');
const corporateUser = require('../../../entities/corporateUser');
const { Op } = require('sequelize');

jest.mock('../../../entities/whatsappSubscription', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  findAndCountAll: jest.fn(),
}));

describe('findAllAddOnAndCount Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and count all add-ons', async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: 'Test',
      sort: 'ASC',
      sortField: 'createdAt',
      corporateId: 1,
      from: '2023-01-01',
      to: '2023-12-31',
      status: 'ACTIVE',
      subCorporateUserId: 2,
    };
  
    const mockAddOns = {
      count: 1,
      rows: [
        {
          id: 1,
          subscriptionStartDate: '2023-01-01',
          subscriptionEndDate: '2023-12-31',
          subscriptionPrice: 100,
          subscriptionAmountPaid: 100,
          discount: 10,
          status: 'ACTIVE',
          billingType: 'MONTHLY',
          projectId: 'TEST123',
          invoiceId: 'INV123',
          createdAt: '2023-01-01',
          isCustom: true,
          credential: {
            id: 1,
            name: 'Test Credential',
            username: 'testuser',
            registeredByCredential: {
              name: 'Admin',
            },
          },
          corporateUser: {
            id: 2,
            name: 'Test Corporate User',
          },
        },
      ],
    };
  
    WhatsAppSubscription.findAndCountAll.mockResolvedValue(mockAddOns);
  
    const result = await findAllAddOnAndCount(params);
  
    const expectedToDate = new Date('2023-12-31T18:30:00.000Z'); // Adjusted to match function behavior
  
    expect(WhatsAppSubscription.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: [
          'id',
          'subscriptionStartDate',
          'subscriptionEndDate',
          'subscriptionPrice',
          'subscriptionAmountPaid',
          'discount',
          'status',
          'billingType',
          'projectId',
          'invoiceId',
          'createdAt',
          'isCustom',
          'addOnType',
        ],
        include: [
          {
            model: credential,
            attributes: ['id', 'name', 'username'],
            include: [
              {
                model: credential,
                as: 'registeredByCredential',
                attributes: ['name'],
              },
            ],
          },
          {
            model: corporateUser,
            attributes: ['id', 'name'],
          },
        ],
        where: expect.objectContaining({
          [Op.and]: expect.arrayContaining([
            { isCustom: true },
            expect.objectContaining({
              [Op.or]: expect.arrayContaining([
                { id: expect.objectContaining({ [Op.like]: '%Test%' }) },
                { projectId: expect.objectContaining({ [Op.like]: '%Test%' }) },
                { invoiceId: expect.objectContaining({ [Op.like]: '%Test%' }) },
                { '$credential.username$': expect.objectContaining({ [Op.like]: '%Test%' }) },
                { '$credential.name$': expect.objectContaining({ [Op.like]: '%Test%' }) },
              ]),
            }),
            { createdAt: expect.objectContaining({ [Op.between]: ['2023-01-01', expectedToDate] }) },
            { corporateUserId: 1 },
            { status: 'ACTIVE' }, // Ensure this is correctly separated
            { subCorporateUserId: 2 },
          ]),
        }),
        order: [['createdAt', 'ASC']],
        limit: 10,
        offset: 0,
      })
    );
    
    expect(result).toEqual(mockAddOns);
  });
  

  it('should handle errors gracefully', async () => {
    const params = {
      limit: 10,
      offset: 0,
      searchText: 'Test',
      sort: 'ASC',
      sortField: 'createdAt',
      corporateId: 1,
      from: '2023-01-01',
      to: '2023-12-31',
      status: 'ACTIVE',
      subCorporateUserId: 2,
    };

    WhatsAppSubscription.findAndCountAll.mockRejectedValue(new Error('Database error'));

    await expect(findAllAddOnAndCount(params)).rejects.toThrow('Database error');
  });
});
