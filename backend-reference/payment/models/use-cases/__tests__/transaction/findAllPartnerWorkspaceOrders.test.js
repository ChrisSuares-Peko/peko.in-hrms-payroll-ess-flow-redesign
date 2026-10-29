const { Op } = require('sequelize');
const orders = require('../../../entities/order'); // Adjusted path
const serviceOperator = require('../../../entities/serviceOperator'); // Adjusted path
const credential = require('../../../entities/credential'); // Adjusted path
const {findAllPartnerWorkspaceOrders} = require('../../transaction'); // Adjusted path



jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => jest.fn());
jest.mock('../../../entities/credential', () => jest.fn());

describe('findAllPartnerWorkspaceOrders', () => {
    const mockParams = {
        corporateId: 1,
        start: 0,
        from: '2024-01-01',
        to: '2024-12-31',
        length: 10,
        searchText: 'Test',
        order: 'ASC',
        column: 1,
        partnerId: 123,
    };

    const mockResult = {
        count: 2,
        rows: [
            {
                id: 1,
                corporateTxnId: 'TXN123',
                'credential.name': 'Corporate A',
                'planDetails.name': 'Plan X',
                transactionDate: '2024-01-15',
                amountInINR: 5000,
                paymentMode: 'Credit Card',
                status: 'Completed',
                'bookingDetails.name': 'Workspace A',
            },
            {
                id: 2,
                corporateTxnId: 'TXN124',
                'credential.name': 'Corporate B',
                'planDetails.name': 'Plan Y',
                transactionDate: '2024-02-15',
                amountInINR: 7000,
                paymentMode: 'Net Banking',
                status: 'Pending',
                'bookingDetails.name': 'Workspace B',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return filtered and sorted orders', async () => {
        // Mock database response
        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllPartnerWorkspaceOrders(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            include: [
                {
                    model: serviceOperator,
                    where: {
                        serviceCategory: 'Workspaces',
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
            order: [['credential.name', 'ASC']], // Column index 1 maps to "credential.name"
            limit: mockParams.length,
            offset: mockParams.start,
            raw: true,
            nest: true,
        });

        expect(result).toEqual(mockResult);
    });

    it('should return default sorting column if column index is invalid', async () => {
        // Modify params with invalid column
        const invalidColumnParams = { ...mockParams, column: 999 };

        orders.findAndCountAll.mockResolvedValue(mockResult);

        const result = await findAllPartnerWorkspaceOrders(invalidColumnParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                order: [['createdAt', 'ASC']], // Default sorting column
            })
        );

        expect(result).toEqual(mockResult);
    });

    it('should handle empty results', async () => {
        orders.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

        const result = await findAllPartnerWorkspaceOrders(mockParams);

        expect(result).toEqual({ count: 0, rows: [] });
    });

    it('should throw an error if findAndCountAll fails', async () => {
        const errorMessage = 'Database error';
        orders.findAndCountAll.mockRejectedValue(new Error(errorMessage));

        await expect(findAllPartnerWorkspaceOrders(mockParams)).rejects.toThrow(
            errorMessage
        );
    });
});
