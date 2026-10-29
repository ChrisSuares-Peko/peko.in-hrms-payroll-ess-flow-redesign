const { createBusBooking } = require('../../../use-cases/bus');
const busBooking = require('../../../entities/busBooking');

jest.mock('../../../entities/busBooking', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    belongsTo: jest.fn(),
}));
jest.mock('@logtail/node', () => ({
    Logtail: jest.fn().mockImplementation(() => ({})),
}));

const mockReq = {
    LogTraceId: 'test-trace-id',
    user: {
        id: 1,
        role: 'CORPORATE_USER',
        subCorporateId: null,
    },
};

const mockTicketDetails = {
    tin: '8BDJUN94',
    pnr: '8BDJUN94',
    status: 'BOOKED',
    travels: 'TESTING ACCOUNT',
    busType: 'Volvo A/C Sleeper (2+1)',
    cancellationPolicy: '0:12:100:0;12:24:50:0;24:-1:10:0',
    bookingFee: 0,
    serviceCharge: '0.00',
    inventoryId: '123456',
    doj: '2026-07-13T00:00:00+05:30',
    dateOfIssue: '2026-07-13T09:50:37+05:30',
    serviceStartTime: '2026-07-13 18:00:00',
    sourceCity: 'Bengaluru',
    sourceCityId: '3',
    destinationCity: 'Chennai',
    destinationCityId: '102',
    pickupLocation: 'Domlur',
    pickupLocationId: '122423',
    pickUpLocationAddress: 'Domlur',
    pickupLocationLandmark: 'Domlur',
    pickupTime: '1080',
    pickUpContactNo: '1234567890',
    firstBoardingPointTime: '1080',
    dropLocation: '100 feet road',
    dropLocationId: '122416',
    dropLocationAddress: '100 feet road',
    dropLocationLandmark: '100 feet road',
    dropTime: '1740',
    primeDepartureTime: '1080',
    MTicketEnabled: 'true',
    partialCancellationAllowed: 'true',
    inventoryItems: {
        seatName: '2',
        fare: '10.50',
        baseFare: '10.00',
        grandTotalFare: '10.50',
        ladiesSeat: false,
        malesSeat: false,
        serviceTax: '0.50',
        operatorServiceCharge: '0.00',
        passenger: {
            name: 'John Doe',
            mobile: '9876543210',
            title: 'Mr',
            email: 'john@example.com',
            age: 30,
            gender: 'MALE',
        },
    },
};

const mockTransactionResponse = {
    orderId: 10990,
    transactionId: 5001,
};

describe('createBusBooking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return undefined when ticketDetails is not provided', async () => {
        const result = await createBusBooking({ ticketDetails: null, transactionResponse: mockTransactionResponse, req: mockReq });
        expect(result).toBeUndefined();
        expect(busBooking.create).not.toHaveBeenCalled();
    });

    it('should create a bus booking with correct data', async () => {
        const mockRecord = { id: 1, tin: '8BDJUN94' };
        busBooking.create.mockResolvedValue(mockRecord);

        const result = await createBusBooking({
            ticketDetails: mockTicketDetails,
            transactionResponse: mockTransactionResponse,
            req: mockReq,
        });

        expect(busBooking.create).toHaveBeenCalledWith(
            expect.objectContaining({
                tin: '8BDJUN94',
                pnr: '8BDJUN94',
                bookingStatus: 'BOOKED',
                travels: 'TESTING ACCOUNT',
                busType: 'Volvo A/C Sleeper (2+1)',
                orderId: 10990,
                transactionId: 5001,
                credentialId: 1,
                subCorporateUserId: null,
            })
        );
        expect(result).toEqual(mockRecord);
    });

    it('should set subCorporateUserId when role is CORPORATE_SUB_USER', async () => {
        const subUserReq = {
            ...mockReq,
            user: { ...mockReq.user, role: 'CORPORATE_SUB_USER', subCorporateId: 42 },
        };
        busBooking.create.mockResolvedValue({ id: 1 });

        await createBusBooking({
            ticketDetails: mockTicketDetails,
            transactionResponse: mockTransactionResponse,
            req: subUserReq,
        });

        expect(busBooking.create).toHaveBeenCalledWith(
            expect.objectContaining({ subCorporateUserId: 42 })
        );
    });

    it('should handle inventoryItems as array and map all passengers', async () => {
        const multiSeatTicket = {
            ...mockTicketDetails,
            inventoryItems: [
                { ...mockTicketDetails.inventoryItems, seatName: '2' },
                { ...mockTicketDetails.inventoryItems, seatName: '3' },
            ],
        };
        busBooking.create.mockResolvedValue({ id: 1 });

        await createBusBooking({
            ticketDetails: multiSeatTicket,
            transactionResponse: mockTransactionResponse,
            req: mockReq,
        });

        const callArg = busBooking.create.mock.calls[0][0];
        expect(callArg.passengers).toHaveLength(2);
        expect(callArg.passengers[0].seatName).toBe('2');
        expect(callArg.passengers[1].seatName).toBe('3');
    });

    it('should return the error when database operation fails', async () => {
        const mockError = new Error('Database error');
        busBooking.create.mockRejectedValue(mockError);

        const result = await createBusBooking({
            ticketDetails: mockTicketDetails,
            transactionResponse: mockTransactionResponse,
            req: mockReq,
        });

        expect(result).toEqual(mockError);
    });
});
