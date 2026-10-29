const { getBusBookingByOrderId } = require('../../../use-cases/bus');
const busBooking = require('../../../entities/busBooking');

jest.mock('../../../entities/busBooking', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({})),
}));

describe('getBusBookingByOrderId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a booking when a matching orderId is found', async () => {
        const mockBooking = {
            id: 1,
            tin: '8BDJUN94',
            pnr: '8BDJUN94',
            orderId: 10990,
            bookingStatus: 'BOOKED',
        };
        busBooking.findOne.mockResolvedValue(mockBooking);

        const result = await getBusBookingByOrderId({ orderId: 10990 });

        expect(busBooking.findOne).toHaveBeenCalledWith({ where: { orderId: 10990 } });
        expect(result).toEqual(mockBooking);
    });

    it('should return null when no booking is found for the given orderId', async () => {
        busBooking.findOne.mockResolvedValue(null);

        const result = await getBusBookingByOrderId({ orderId: 99999 });

        expect(busBooking.findOne).toHaveBeenCalledWith({ where: { orderId: 99999 } });
        expect(result).toBeNull();
    });

    it('should return null when database operation fails', async () => {
        const mockError = new Error('Database error');
        busBooking.findOne.mockRejectedValue(mockError);

        const result = await getBusBookingByOrderId({ orderId: 10990 });

        expect(result).toBeNull();
    });
});
