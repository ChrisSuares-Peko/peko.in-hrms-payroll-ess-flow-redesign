const { createFlightBooking } = require('../../../use-cases/flight');
const flightBooking = require('../../../entities/flight/flightBooking');

jest.mock('../../../entities/flight/flightBooking', () => ({
  create: jest.fn(),
}));

jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../../enum/flight', () => ({
  ticketStatus: {
    CONFIRMED: 'CONFIRMED'
  }
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
        role: 'CORPORATE_USER',
        subCorporateId: null,
      },
      body: {
        customerInfo: { name: 'John Doe', email: 'john@example.com' },
        outbount: { userContactDetails: {} },
      },
    };

    const mockCreatedBooking = {
      id: 1,
      bookingStatus: 'CONFIRMED'
    };

    flightBooking.create.mockResolvedValue(mockCreatedBooking);

    const result = await createFlightBooking({
      booking: mockBooking,
      transactionResponse: mockTransactionResponse,
      req: mockReq,
    });

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
        outbount: { userContactDetails: {} }, 
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

 it('should throw an error when database operation fails', async () => {
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
      role: 'CORPORATE_USER',
      subCorporateId: null,
    },
    body: {
      customerInfo: { name: 'John Doe', email: 'john@example.com' },
      outbount: { userContactDetails: {} },
    },
  };

  const mockError = new Error('Database error');
  flightBooking.create.mockRejectedValue(mockError);

  const result = await createFlightBooking({
    booking: mockBooking,
    transactionResponse: mockTransactionResponse,
    req: mockReq,
  });

  expect(result).toEqual(mockError); 
});

});