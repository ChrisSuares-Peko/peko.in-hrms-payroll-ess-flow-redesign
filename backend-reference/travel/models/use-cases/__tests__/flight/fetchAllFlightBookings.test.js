const { fetchAllFlightBookings } = require('../../../use-cases/flight');
const flightBooking = require('../../../entities/flight/flightBooking');
const transaction = require('../../../entities/transaction');
const orders = require('../../../entities/order');

jest.mock('../../../entities/flight/flightBooking', () => ({
    findAndCountAll: jest.fn(),
    hasMany: jest.fn()
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('fetchAllFlightBookings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return flight bookings for upcoming availability', async () => {
        const mockParams = {
            credentialId: 123,
            limit: 10,
            page: 1,
            availability: 'upcoming'
        };

        const mockResponse = {
            count: 2,
            rows: [
                {
                    id: 1,
                    createdAt: '2024-02-15T12:00:00Z',
                    bookingStatus: 'CONFIRMED',
                    journey: '[{"Origin": {"DepTime": "2024-03-01T10:00:00Z"}}]',
                    transaction: { id: 1, corporateTxnId: 'TXN001', transactionDate: '2024-02-10T12:00:00Z' },
                    orders: { id: 10, baseAmount: 500, status: 'PAID', paymentMode: 'Credit Card' }
                }
            ]
        };

        flightBooking.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllFlightBookings(mockParams);

        expect(flightBooking.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.any(Object),
                include: expect.arrayContaining([
                    expect.objectContaining({ model: transaction, attributes: expect.any(Array) }),
                    expect.objectContaining({ model: orders, attributes: expect.any(Array) })
                ]),
                order: [['createdAt', 'DESC']],
                limit: 10,
                offset: 0
            })
        );

        expect(result).toEqual(mockResponse);
    });

    it('should return flight bookings for expired availability', async () => {
        const mockParams = {
            credentialId: 123,
            limit: 10,
            page: 1,
            availability: 'expired'
        };

        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: 2,
                    createdAt: '2024-01-10T12:00:00Z',
                    bookingStatus: 'CANCELLED_REQUEST_FOR_REFUND',
                    journey: '[{"Origin": {"DepTime": "2024-01-01T10:00:00Z"}}]',
                    transaction: { id: 2, corporateTxnId: 'TXN002', transactionDate: '2024-01-05T12:00:00Z' },
                    orders: { id: 20, baseAmount: 600, status: 'REFUNDED', paymentMode: 'PayPal' }
                }
            ]
        };

        flightBooking.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllFlightBookings(mockParams);

        expect(flightBooking.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should return flight bookings for modification requested availability', async () => {
        const mockParams = {
            credentialId: 123,
            limit: 10,
            page: 1,
            availability: 'modification_requested'
        };

        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: 3,
                    createdAt: '2024-02-01T12:00:00Z',
                    bookingCurrentStatus: 'MODIFICATION_REQUESTED',
                    journey: '[{"Origin": {"DepTime": "2024-03-05T10:00:00Z"}}]',
                    transaction: { id: 3, corporateTxnId: 'TXN003', transactionDate: '2024-01-30T12:00:00Z' },
                    orders: { id: 30, baseAmount: 700, status: 'PROCESSING', paymentMode: 'Credit Card' }
                }
            ]
        };

        flightBooking.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllFlightBookings(mockParams);

        expect(flightBooking.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty result when no flight bookings match', async () => {
        const mockParams = {
            credentialId: 999,
            limit: 10,
            page: 1,
            availability: 'upcoming'
        };

        const mockResponse = { count: 0, rows: [] };

        flightBooking.findAndCountAll.mockResolvedValue(mockResponse);

        const result = await fetchAllFlightBookings(mockParams);

        expect(flightBooking.findAndCountAll).toHaveBeenCalledWith(expect.any(Object));
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error when database operation fails', async () => {
        const mockParams = {
            credentialId: 123,
            limit: 10,
            page: 1,
            availability: 'upcoming'
        };

        const mockError = new Error('Database error');

        flightBooking.findAndCountAll.mockRejectedValue(mockError);

        await expect(fetchAllFlightBookings(mockParams)).rejects.toThrow('Database error');
    });
});
