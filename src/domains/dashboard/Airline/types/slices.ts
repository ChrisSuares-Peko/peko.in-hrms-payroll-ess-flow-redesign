import { Journey } from './airlineList';

type FlightSegment = {
    Origin: string;
    Destination: string;
    FlightCabinClass: number;
    PreferredDepartureTime: string;
};

type PassengerData = {
    adultCount: number;
    childCount: number;
    infantCount: number;
};

type FormData = {
    tripType: string;
    flightSegments: FlightSegment[];
    passengerData: PassengerData;
};

export type SearchData = {
    tripType: number;
    fromLocation: string;
    toLocation: string;
    depart: string;
    departDay: string;
    arrive: string;
    arriveDay: string;
    fromLocation1: string;
    toLocation1: string;
    depart1: string;
    departDay1: string;
    arrive1: string;
    arriveDay1: string;
    adults: number;
    children: number;
    infants: number;
    class: number;
    originCountryCode: string;
    destinationCountryCode: string;
};

type SelectedAncillary = {
    ancType: string;
    ancillaryOfferId: string;
    passengerKey: string;
    segmentKey: string;
    itemPrice: number;
    title: string;
};

type SelectedAncillaries = {
    selectedAncillaries: SelectedAncillary[];
    conversationId: string;
    isLcc: boolean;
    offerId: string;
};

type QuickUpdateData = {
    date: string;
    tripType: string;
};

type FlightClass = 1 | 2 | 3 | 4 | 5 | 6;

export interface SelectedAirline {
    id: number;
    logo: string;
    flightName: string;
    flightClass: FlightClass;
    flightDuration: number;
    stopCount: number;
    depart: {
        datetime: Date | string;
    };
    arrive: {
        datetime: Date | string;
    };
    onPoint: string;
    offPoint: string;
    journey: Journey[][];
    flightCode: string;
    totalTax: number;
    lcc: boolean;
    price: number;
    flightNumber: string;
    operatingAirline: string;
    ResultIndex: string;
    fareInclusions?: string[];
    IsGSTMandatory?: boolean;
    GSTAllowed?: boolean;
}

export interface Passenger {
    AddressLine1: string;
    AddressLine2: string;
    CellCountryCode: string;
    City: string;
    ContactNo: string;
    CountryCode: string;
    CountryName: string;
    DateOfBirth: string;
    Email: string;
    FirstName: string;
    LastName: string;
    Gender: number;
    IsLeadPax: boolean;
    Nationality: string;
    PassportExpiry: string;
    PassportIssueDate: string;
    PassportNo: string;
    PaxType: number;
    Title: string;
    passengerId: string;
    Fare: {
        AdditionalTxnFeeOfrd: number;
        AdditionalTxnFeePub: number;
        BaseFare: number;
        Tax: number;
        YQTax: number;
    };
    Baggage: Baggage[];
    MealDynamic: MealDynamic[];
    SeatDynamic: SeatDynamic[];
    PAN: string;
}

export interface SeatDynamic {
    AirlineCode: string;
    Code: string;
    Currency: string;
    Description: number;
    Destination: string;
    FlightNumber: string;
    Origin: string;
    Price: number;
    SeatWayType: number;
    Compartment: number;
    Deck: number;
    RowNo: string;
    SeatNo: string;
    CraftType: string;
    AvailablityType: number;
}

export interface Baggage {
    AirlineCode: string;
    Code: string;
    Currency: string;
    Description: number;
    Destination: string;
    FlightNumber: string;
    Origin: string;
    Price: number;
    WayType: number;
    Weight: number;
}

export interface MealDynamic {
    AirlineCode: string;
    Code: string;
    Currency: string;
    Description: number;
    Destination: string;
    FlightNumber: string;
    Origin: string;
    Price: number;
    WayType: number;
    Quantity: number;
    AirlineDescription: string;
}

export interface CustomerInfo {
    emailAddress: string;
    phone: string;
    phoneCode: string;
}
export interface BookingData {
    passengers: Passenger[];
    customerInfo: CustomerInfo;
    gstDetails: GSTDetails;
}

export interface GSTDetails {
    GSTCompanyAddress?: string;
    GSTCompanyContactNumber?: string;
    GSTCompanyEmail?: string;
    GSTCompanyName?: string;
    GSTNumber?: string;
}

export interface OrderDetails {
    id: number;
    PNR: string;
    inbountPNR: string;
    inbountBookingId: string;
    orderId: string;
    BookingId: string;
    passengers: OrderDetailsPassenger[];
    journey: Journey[];
    bookingStatus: string;
    inbountBookingStatus: string;
}

export interface OrderDetailsPassenger extends Passenger {
    Ticket: {
        TicketId: string;
        TicketNumber: string;
    };
}

export interface SearchFilter {
    startValue: number;
    endValue: number;
    airlineRadioValue: string[];
    airlineTimeRadioValue: number[];
    layoverVal: number[];
}

export type InitialState = {
    formData: FormData;
    searchData: SearchData;
    selectedAirline: SelectedAirline;
    selectedInbountAirline: SelectedAirline;
    airlineData: any;
    bookingData: BookingData;
    provBookingSuccess: any;
    paymentSuccesResponse: any;
    ancillariesSearch: any;
    selectedAncillaries: SelectedAncillaries;
    quickUpdateData: QuickUpdateData;
    orderDetails: OrderDetails;
    flightResponse: any;
    inbountFlightResponse: any;
    fairRulesData: any;
    priceRange: any;
    paymentData: any;
    TraceId: string;
    PNR: string;
    BookingId: string;
    isContactInfoValid: boolean;
    contactInfoPassenger: string;
    isGSTDetailsValid: boolean;
    searchFilter: SearchFilter, 
    outbountFare: number, 
    inbountFare: number;
    searchInitiatedAt: string | null;
    bookingCompletedAt: string | null;
};

export type SetPassengerPayload = {
    passengerId: string;
    anc: SeatDynamic[] | MealDynamic[] | Baggage[];
    ancType: AncType;
};

export type RemovePassengerPayload = {
    passengerId: string;
    index: number;
    ancType: AncType;
};

export type AncType = 'Baggage' | 'MealDynamic' | 'SeatDynamic';
