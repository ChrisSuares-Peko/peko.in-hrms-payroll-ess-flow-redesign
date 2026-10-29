import { Journey } from './airlineList';

export interface Flight {
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
    baggageAllowance?: string | number;
    seatsAvailable?: number;
    fareInclusions?: string[];
    fareType?: string;
    isRefundable?: boolean;
    isGSTMandatory?: boolean;
    miniFareRules?: any[];
    offeredFare?: number;
    publishedFare?: number;
    FareClassification?: {
        Color?: string;
        Type?: string;
    };
}

export type filterTypes = {
    startPrice: number;
    endPrice: number;
    layover: number[];
    airlineTimeCode: any;
    flightCode: string[];
};

type FlightClass = 1 | 2 | 3 | 4 | 5 | 6;

export type LayoverCounts = {
    0: number;
    1: number;
    2: number;
};
