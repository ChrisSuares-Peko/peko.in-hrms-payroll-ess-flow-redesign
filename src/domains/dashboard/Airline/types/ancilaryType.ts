import { SeatDynamic } from './slices';

type PassengerInfo = {
    nameTitle: string;
    givenName: string;
    surname: string;
};

type AncillaryQuantity = {
    min: number;
    max: number;
    chargeType: string;
    applicableType: string;
};

export type AncillaryRule = {
    ancillaryType: string;
    ancillaryQuantity: AncillaryQuantity[];
};

type Fare = {
    buyingCurrency: string;
    buyingAmount: number;
    sellingCurrency: string;
    sellingAmount: number;
};

type Ancillary = {
    ancillaryOfferId: string;
    ancillaryCode: string;
    ancillaryDescription: string;
    type: string;
    isAncillaryTripWise: boolean;
};

type SegmentPassengerMapping = {
    segmentKeys: string[];
    passengerKeys: string[];
};

type Seat = {
    seatCode: string;
    ancillaryOfferId: string;
    availability: string;
    seatType: string;
    exitRow: boolean;
    noSeat: boolean;
    seatNumber: string;
    chargeable: boolean;
    childAllowed: boolean;
    infantAllowed: boolean;
    restrictedGeneral: boolean;
    cabinClass: string;
    fare: Fare[];
};

type Cabin = {
    deck: {
        type: string;
        airRow: {
            rowNumber: number;
            airSeats: Seat[];
        }[];
    }[];
    segmentPassengerMapping: SegmentPassengerMapping;
};

type SeatMap = {
    cabin: Cabin[];
};

type FlightSegment = {
    segmentKey: string;
    departureAirportCode: string;
    departureDateTime: string;
    arrivalAirportCode: string;
    arrivalDateTime: string;
    flightNumber: string;
    operatingAirline: string;
};

type Passenger = {
    passengerKey: string;
    ptc: string;
    passengerInfo: PassengerInfo;
};

export type AncillaryMeal = {
    ancillary: Ancillary;
    fare: Fare[];
    segmentPassengerMapping: SegmentPassengerMapping;
};

type AncillaryItem = {
    ancillary: Ancillary;
    fare: Fare[];
    segmentPassengerMapping: SegmentPassengerMapping;
};

type DataItem = {
    flightSegments: FlightSegment[];
    passengers: Passenger[];
    ancillaryRules: AncillaryRule[];
    seatMap: SeatMap[];
    meals: AncillaryMeal[];
    baggages: AncillaryItem[];
};

type Meta = {
    success: boolean;
    statusCode: number;
    statusMessage: string;
    actionType: string;
    conversationId: string;
};

type CommonData = {
    searchKey: string;
    productCode: string;
};

export type AncillarySearch = {
    conversationId: string;
    meta: Meta;
    commonData: CommonData;
    data: DataItem[];
    version: string;
};

export type selectedAnc = {
    ancType: string;
    ancillaryOfferId: string;
    passengerKey: string;
    segmentKey: string;
};

export type SeatResponseType = {
    SegmentSeat: SegmentSeatType[];
};

export type SegmentSeatType = {
    RowSeats: RowSeats[];
};

export type RowSeats = {
    Seats: SeatDynamic[];
};
