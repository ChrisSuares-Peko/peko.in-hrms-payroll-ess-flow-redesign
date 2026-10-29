const { fetchAllFlightBookings, updateStatusById } = require('../../flight');
const flightBooking = require('../../../entities/flights/flightBooking');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('fetchAllFlightBookings', () => {
    it('should fetch all flight bookings with CANCELLED_REQUEST_FOR_REFUND status', async () => {
        const mockResult = [
            { id: 1, bookingStatus: 'CANCELLED_REQUEST_FOR_REFUND', corporateTxnId: 'TXN1' }
        ];
        sequelizeConfig.query.mockResolvedValue(mockResult);

        const result = await fetchAllFlightBookings();
        expect(result).toEqual(mockResult);
        expect(sequelizeConfig.query).toHaveBeenCalledWith(
            expect.stringContaining('CANCELLED_REQUEST_FOR_REFUND'),
            expect.objectContaining({ type: 'SELECT' })
        );
    });

    it('should return empty array when no bookings found', async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        const result = await fetchAllFlightBookings();
        expect(result).toEqual([]);
    });
});

describe('updateStatusById', () => {
    it('should update flight booking status by id', async () => {
        flightBooking.update.mockResolvedValue([1]);

        const result = await updateStatusById({ id: 1, status: 'REFUNDED' });
        expect(result).toEqual([1]);
        expect(flightBooking.update).toHaveBeenCalledWith(
            { bookingStatus: 'REFUNDED' },
            { where: { id: 1 } }
        );
    });

    it('should return [0] when no booking found to update', async () => {
        flightBooking.update.mockResolvedValue([0]);

        const result = await updateStatusById({ id: 999, status: 'REFUNDED' });
        expect(result).toEqual([0]);
    });
});
