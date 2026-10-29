export interface Journey {
    Baggage: string;
    CabinBaggage: string;
    CabinClass: number;
    Airline: {
        AirlineCode: string;
        AirlineName: string;
        FlightNumber: string;
        FareClass: string;
        OperatingCarrier: string;
    };
    NoOfSeatAvailable: number;
    Origin: {
        Airport: {
            AirportCode: string;
            AirportName: string;
            Terminal: string;
            CityName: string;
        };
        DepTime: string;
    };
    Destination: {
        Airport: {
            AirportCode: string;
            AirportName: string;
            Terminal: string;
            CityName: string;
        };
        ArrTime: string;
    };
    Duration: number;
    TripIndicator?: number;
    SegmentIndicator?: number;
}

interface FareType {
    fareCode: string;
    farePreference: string;
    preferenceContext: string;
    refundable: boolean;
}

interface CustomerAdditionalFareInfo {
    transactionFeeEarned: number;
    discount: number;
    plbearned: number;
    incentiveEarned: number;
    tdsOnIncentive: number;
}

interface FareBreakdown {
    fareBreakdownKey: string;
    passengerKeys: string[];
    fareType: string;
    fareReference: {
        fareBasis: string;
        segmentKey: string;
    }[];
    paxType: string;
    paxRate: {
        baseFare: number;
        totalTax: number;
        totalFare: string;
        taxes: {
            amount: number;
            taxCode: string;
        }[];
        customerAdditionalFareInfo: CustomerAdditionalFareInfo;
    };
}

interface Fare {
    fareKey: string;
    currencyCode: string;
    fareType: FareType;
    baseFare: number;
    totalTax: number;
    totalFare: number;
    platingAirlineCode: string;
    customerAdditionalFareInfo: CustomerAdditionalFareInfo;
    fareBreakdown: FareBreakdown[];
}

interface Data {
    offerId: string;
    detail: {
        ancillaryDetailsAvailable: boolean;
        lcc: boolean;
        apis: boolean;
        ndc: boolean;
        onHoldSupported: boolean;
        moreFaresAvailable: boolean;
        reissueSupported: boolean;
        fareRuleMandatory: boolean;
    };
    journey: Journey[];
    fare: Fare;
}

interface Meta {
    success: boolean;
    statusCode: number;
    statusMessage: string;
    actionType: string;
    conversationId: string;
}

interface CommonData {
    searchKey: string;
    productCode: string;
}

export interface IFlightSearchResponse {
    conversationId: string;
    meta: Meta;
    commonData: CommonData;
    data: Data[];
}
