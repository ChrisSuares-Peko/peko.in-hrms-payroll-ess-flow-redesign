import { Journey } from './airlineList';

export type Booking = {
    id: string;
    logo: string;
    flightName: string;
    flightClass: string;
    bookingCode: string;
    flightDuration: number;
    ConfimationNumber: string;
    conversationId: string;
    corporateTxnId: string;
    bookingReferenceId: string;
    status: string;
    stopCount: string;
    depart: {
        datetime: Date;
        airport: string;
        terminal: string;
    };
    arrive: {
        datetime: Date;
        airport: string;
        terminal: string;
    };
    journey: Journey[];
    pnr: string;
    bookingId: string;
};
