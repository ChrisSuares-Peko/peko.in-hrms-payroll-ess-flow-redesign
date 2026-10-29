const { AddOnsExport } = require('../../whatsappBusiness');
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
 
describe('AddOnsExport Use-Case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
 
    it('should export add-ons data in the required format', async () => {
        const params = {
            searchText: 'Test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: '2023-01-01',
            to: '2023-12-31',
            status: 'ACTIVE',
        };
 
        const mockAddOns = {
            rows: [
                {
                    id: 1,
                    createdAt: '2023-01-01',
                    corporateUser: { name: 'Test Corporate User' },
                    credential: { username: 'testuser' },
                    subscriptionPrice: 100,
                    subscriptionAmountPaid: 100,
                    status: 'ACTIVE',
                },
            ],
        };
 
        WhatsAppSubscription.findAndCountAll.mockResolvedValue(mockAddOns);
 
        const result = await AddOnsExport(params);
 
        // Use expect.any(Date) for the end date to avoid timezone issues
        expect(WhatsAppSubscription.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                attributes: expect.arrayContaining([
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
                ]),
                include: expect.arrayContaining([
                    expect.objectContaining({
                        model: credential,
                        attributes: ['id', 'name', 'username'],
                        include: expect.arrayContaining([
                            expect.objectContaining({
                                model: credential,
                                as: 'registeredByCredential',
                                attributes: ['name'],
                            }),
                        ]),
                    }),
                    expect.objectContaining({
                        model: corporateUser,
                        attributes: ['id', 'name'],
                    }),
                ]),
                where: expect.objectContaining({
                    createdAt: {
                        [Op.between]: expect.arrayContaining([
                            params.from,
                            expect.any(Date) // Use expect.any(Date) instead of exact date string
                        ])
                    },
                    [Op.and]: expect.arrayContaining([
                        { isCustom: true },
                        expect.objectContaining({
                            [Op.or]: expect.arrayContaining([
                                { id: { [Op.like]: '%Test%' } },
                                { projectId: { [Op.like]: '%Test%' } },
                                { invoiceId: { [Op.like]: '%Test%' } },
                                { '$credential.username$': { [Op.like]: '%Test%' } },
                                { '$credential.name$': { [Op.like]: '%Test%' } },
                            ])
                        }),
                        { status: 'ACTIVE' },
                    ]),
                }),
                order: [['createdAt', 'ASC']],
                raw: true,
                nest: true,
            })
        );
 
        const expectedResult = [
            {
                Date: '2023-01-01',
                'Corporate Name': 'Test Corporate User',
                'Corporate ID': 'testuser',
                'Add-on': 'Not Available',
                Amount: '₹ 100.00',
                'Amount Paid': '₹ 100.00',
                Status: 'Active',
            },
        ];
 
        expect(result).toEqual(expectedResult);
    });
 
    it('should handle errors gracefully', async () => {
        const params = {
            searchText: 'Test',
            sort: 'ASC',
            sortField: 'createdAt',
            from: '2023-01-01',
            to: '2023-12-31',
            status: 'ACTIVE',
        };
 
        WhatsAppSubscription.findAndCountAll.mockRejectedValue(new Error('Database error'));
 
        const result = await AddOnsExport(params);
 
        expect(result).toBe(false);
    });
});
 