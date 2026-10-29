const { fetchBookings } = require('../../../use-cases/hotels');
const orders = require('../../../entities/order');
const { Op } = require('sequelize');

jest.mock('../../../entities/order', () => ({
    findAndCountAll: jest.fn(),
}));
jest.mock("@logtail/node", () => ({
    Logtail: jest.fn().mockImplementation(() => ({
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));
describe('fetchBookings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return bookings successfully', async () => {
        const mockParams = {
            credentialId: 123,
            serviceOperatorId: 456,
            limit: 10,
            page: 1,
            subCorporateUserId: 789
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    transactionDate: '2024-01-15T12:00:00Z',
                    orderResponse: { status: 'Confirmed' }
                },
                {
                    id: 2,
                    transactionDate: '2024-01-14T10:00:00Z',
                    orderResponse: { status: 'Failed' }
                }
            ]
        };

        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchBookings(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith({
            where: expect.objectContaining({
                credentialId: 123,
                serviceOperatorId: 456,
                subCorporateUserId: 789,
                orderResponse: { [Op.ne]: null }
            }),
            order: [['transactionDate', 'DESC']],
            limit: 10,
            offset: 0
        });

        expect(result).toEqual(mockResponse);
    });

    it('should return bookings without subCorporateUserId filter', async () => {
        const mockParams = {
            credentialId: 123,
            serviceOperatorId: 456,
            limit: 10,
            page: 1
        };

        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: 1,
                    transactionDate: '2024-01-15T12:00:00Z',
                    orderResponse: { status: 'Confirmed' }
                }
            ]
        };

        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchBookings(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    credentialId: 123,
                    serviceOperatorId: 456,
                    orderResponse: { [Op.ne]: null }
                }),
                limit: 10,
                offset: 0
            })
        );

        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no bookings match', async () => {
        const mockParams = {
            credentialId: 999,
            serviceOperatorId: 888,
            limit: 10,
            page: 1
        };

        const mockResponse = { count: 0, rows: [] };

        orders.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchBookings(mockParams);

        expect(orders.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            credentialId: 123,
            serviceOperatorId: 456,
            limit: 10,
            page: 1
        };

        const mockError = new Error('Database error');

        orders.findAndCountAll.mockRejectedValue(mockError);

        await expect(fetchBookings(mockParams)).rejects.toThrow('Database error');
    });
});
