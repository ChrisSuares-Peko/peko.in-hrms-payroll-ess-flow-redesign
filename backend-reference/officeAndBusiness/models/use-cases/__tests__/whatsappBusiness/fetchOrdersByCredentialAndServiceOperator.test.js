const { fetchOrdersByCredentialAndServiceOperator } = require('../../../use-cases/whatsappBusiness');
const orders = require('../../../entities/order');
const { Op } = require('sequelize');

jest.mock('../../../entities/order', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('fetchOrdersByCredentialAndServiceOperator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return orders matching the credentialId and serviceOperatorId', async () => {
        const mockParams = {
            credentialId: 1,
            serviceOperatorId: 10,
            searchText: '',
            subCorporateUserId: null,
        };
        const mockOrders = [
            { id: 101, paymentMode: 'Credit Card', credentialId: 1, serviceOperatorId: 10 },
            { id: 102, paymentMode: 'PayPal', credentialId: 1, serviceOperatorId: 10 },
        ];

        orders.findAll.mockResolvedValue(mockOrders);

        const result = await fetchOrdersByCredentialAndServiceOperator(mockParams);

        expect(orders.findAll).toHaveBeenCalledWith({ where: expect.objectContaining({
            credentialId: mockParams.credentialId,
            serviceOperatorId: mockParams.serviceOperatorId,
        }) });
        expect(result).toEqual(mockOrders);
    });

    it('should return orders matching the searchText in paymentMode or id', async () => {
        const mockParams = {
            credentialId: 2,
            serviceOperatorId: 20,
            searchText: 'Credit',
            subCorporateUserId: null,
        };
        const mockOrders = [{ id: 103, paymentMode: 'Credit Card', credentialId: 2, serviceOperatorId: 20 }];

        orders.findAll.mockResolvedValue(mockOrders);

        const result = await fetchOrdersByCredentialAndServiceOperator(mockParams);

        expect(orders.findAll).toHaveBeenCalledWith({ where: expect.objectContaining({
            credentialId: mockParams.credentialId,
            serviceOperatorId: mockParams.serviceOperatorId,
            [Op.or]: [
                { paymentMode: { [Op.like]: `%${mockParams.searchText}%` } },
                { id: { [Op.like]: `%${mockParams.searchText}%` } },
            ],
        }) });
        expect(result).toEqual(mockOrders);
    });

    it('should return false when no orders match the criteria', async () => {
        const mockParams = { credentialId: 3, serviceOperatorId: 30, searchText: '', subCorporateUserId: null };
        orders.findAll.mockResolvedValue([]);

        const result = await fetchOrdersByCredentialAndServiceOperator(mockParams);

        expect(result).toBe(false);
    });

  
});
