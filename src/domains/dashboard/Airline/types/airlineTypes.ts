export type airlineData = {
    tripType: string;
    flightSegments: flightSegments[];
    passengerData: {
        adultCount: number;
        childCount: number;
        infantCount: number;
    };
};

type flightSegments = {
    Origin: string;
    Destination: string;
    FlightCabinClass: number;
    PreferredDepartureTime: string;
};

export type ITripData = {
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

export type IGetOneWaySearch = {
    userId: string;
    userType: string;
    tripDetails: airlineData;
};

export type CountryCode = {
    label: string;
    value: string;
};

export type PhoneCode = {
    label: string;
    value: string;
};
