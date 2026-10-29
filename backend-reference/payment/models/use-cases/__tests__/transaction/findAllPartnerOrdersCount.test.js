const { Op } = require('sequelize');
const orders = require('../../../entities/order'); // Adjust path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjust path
const credential = require('../../../entities/credential'); // Adjust path
const {findAllPartnerOrdersCount} = require('../../transaction'); // Adjust path


jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());

describe('findAllPartnerOrdersCount', () => {
    const mockParams = {
        corporateId: 'corporate123',
        start: 0,
        from: '2024-01-01',
        to: '2024-12-31',
        length: 10,
        searchText: 'Test',
        order: 'ASC',
        column: 1,
        partnerId: 'partner456',
    };

    const mockResult = {
        count: 2,
        rows: [
            {
                id: 1,
                corporateTxnId: 'TXN123',
                'credential.name': 'Corporate A',
                productName: 'Product X',
                transactionDate: '2024-01-15',
                totalPrice: 5000,
                paymentMode: 'Credit Card',
                status: 'Completed',
            },
            {
                id: 2,
                corporateTxnId: 'TXN124',
                'credential.name': 'Corporate B',
                productName: 'Product Y',
                transactionDate: '2024-02-15',
                totalPrice: 7000,
                paymentMode: 'Net Banking',
                status: 'Pending',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return filtered and sorted orders based on given parameters', async () => {
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllPartnerOrdersCount(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: {
                        serviceCategory: 'Office Supplies',
                    },
                },
                {
                    model: credential,
                    where: {
                        registeredBy: mockParams.partnerId,
                    },
                    attributes: ['name'],
                },
            ],
            where: {
                transactionDate: {
                    [Op.between]: [mockParams.from, mockParams.to],
                },
                [Op.or]: [
                    { id: { [Op.like]: '%Test%' } },
                    { corporateTxnId: { [Op.like]: '%Test%' } },
                    { operatorId: { [Op.like]: '%Test%' } },
                    { amountInINR: { [Op.like]: '%Test%' } },
                    { baseAmount: { [Op.like]: '%Test%' } },
                    { baseCurrency: { [Op.like]: '%Test%' } },
                    { exchangeRate: { [Op.like]: '%Test%' } },
                    { status: { [Op.like]: '%Test%' } },
                    { paymentMode: { [Op.like]: '%Test%' } },
                    { '$credential.name$': { [Op.like]: '%Test%' } },
                    { message: { [Op.like]: '%Test%' } },
                ],
                credentialId: mockParams.corporateId,
            },
            order: [['credential.name', 'ASC']], // Column index 1 corresponds to "credential.name"
            limit: mockParams.length,
            offset: mockParams.start,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

    it('should handle no results and return empty data', async () => {
        orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllPartnerOrdersCount(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const errorMessage = 'Database error';
        orders.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(findAllPartnerOrdersCount(mockParams)).rejects.toThrow(errorMessage);
    });

    it('should handle invalid column index and use default sorting column', async () => {
        const invalidColumnParams = { ...mockParams, column: 999 }; // Invalid column index

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllPartnerOrdersCount(invalidColumnParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'ASC']], // Default column sorting
            })
        );

        expect(result).toEqual(mockResult);
    });

    it('should include corporateId in whereClause if provided', async () => {
        const corporateIdParams = { ...mockParams, corporateId: 'newCorporateId' };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllPartnerOrdersCount(corporateIdParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: 'newCorporateId',
                }),
            })
        );

        expect(result).toEqual(mockResult);
    });
});
