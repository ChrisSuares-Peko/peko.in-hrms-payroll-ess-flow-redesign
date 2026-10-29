const { createFlightBooking } = require('../../../use-cases/flight');
const flightBooking = require('../../../entities/flight/flightBooking');


// Mocking flightBooking entity
jest.mock('../../../entities/flight/flightBooking', () => ({
    create: jest.fn(),
    hasMany: jest.fn()
}));

// Mocking ticketStatus mapping
jest.mock('../../../../enum/flight', () => ({
    ticketStatus:jest.fn(),
    hasMany: jest.fn()
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('createFlightBooking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a flight booking', async () => {
        const mockBooking = {
            Response: {
                TraceId: 'TRACE123',
                Response: {
                    BookingId: 'BOOK123',
                    PNR: 'PNR456',
                    TicketStatus: 'CONFIRMED',
                    FlightItinerary: {
                        Segments: [{ origin: 'JFK', destination: 'LAX' }],
                        Passenger: [{ name: 'John Doe' }],
                        Fare: { total: 500 },
                    },
                },
            },
        };

        const mockTransactionResponse = {
            orderId: 'ORDER789',
            transactionId: 'TXN101',
        };

       const mockReq = {
    user: {
        id: 1,
        role: 'CORPORATE_SUB_USER',
        subCorporateId: 99,
    },
    body: {
        customerInfo: { name: 'John Doe', email: 'john@example.com' },
        outbount: {
            userContactDetails: {
                phone: "9876543210",
                email: "john@example.com"
            }
        }
    },
};

        const expectedBookingStatus = 'CONFIRMED'; // Explicit check for mapping
        const mockCreatedBooking = {
            id: 1,
            customerInfo: mockReq.body.customerInfo,
            TraceId: mockBooking.Response.TraceId,
            BookingId: mockBooking.Response.Response.BookingId,
            PNR: mockBooking.Response.Response.PNR,
            bookingStatus: expectedBookingStatus,
            journey: mockBooking.Response.Response.FlightItinerary.Segments,
            passengers: mockBooking.Response.Response.FlightItinerary.Passenger,
            fare: mockBooking.Response.Response.FlightItinerary.Fare,
            orderId: mockTransactionResponse.orderId,
            transactionId: mockTransactionResponse.transactionId,
            credentialId: mockReq.user.id,
        };

        flightBooking.create.mockResolvedValue(mockCreatedBooking);

        const result = await createFlightBooking({
            booking: mockBooking,
            transactionResponse: mockTransactionResponse,
            req: mockReq,
        });

        expect(flightBooking.create).toHaveBeenCalledWith(expect.objectContaining({
    customerInfo: mockReq.body.customerInfo,
    credentialId: mockReq.user.id,
    orderId: mockTransactionResponse.orderId,
    transactionId: mockTransactionResponse.transactionId,
}));


        expect(result).toEqual(mockCreatedBooking);
    });

    it('should assign subCorporateUserId for corporate sub-users', async () => {
        const mockBooking = {
            Response: {
                TraceId: 'TRACE123',
                Response: {
                    BookingId: 'BOOK123',
                    PNR: 'PNR456',
                    TicketStatus: 'CONFIRMED',
                    FlightItinerary: {
                        Segments: [{ origin: 'JFK', destination: 'LAX' }],
                        Passenger: [{ name: 'John Doe' }],
                        Fare: { total: 500 },
                    },
                },
            },
        };

        const mockTransactionResponse = {
            orderId: 'ORDER789',
            transactionId: 'TXN101',
        };

     const mockReq = {
    user: {
        id: 1,
        role: 'CORPORATE_SUB_USER',
        subCorporateId: 99,
    },
    body: {
        customerInfo: { name: 'John Doe', email: 'john@example.com' },
        outbount: {
            userContactDetails: {
                phone: "9876543210",
                email: "john@example.com"
            }
        }
    },
};

        const mockCreatedBooking = {
            id: 1,
            subCorporateUserId: 99,
            bookingStatus: 'CONFIRMED',
        };

        flightBooking.create.mockResolvedValue(mockCreatedBooking);

        const result = await createFlightBooking({
            booking: mockBooking,
            transactionResponse: mockTransactionResponse,
            req: mockReq,
        });

       

        expect(result).toEqual(mockCreatedBooking);
    });

   
});
