interface IdentityDocument {
    idDocumentNumber: string;
    idType: string;
    issuingCountryCode: string;
    residenceCountryCode: string;
    expiryDate: string;
}

interface PostalAddress {
    label: string;
    street: string[];
    postalCode: string;
    cityName: string;
    countryCode: string;
}

interface Contact {
    postalAddress: PostalAddress;
    contactsProvided: {
        phone: {
            label: string;
            areaCode: string;
            phoneNumber: string;
        }[];
        emailAddress: string[];
    }[];
}

interface PassengerInfo {
    surname: string;
    gender: string;
    birthDate: string;
    nameTitle: string;
    middleName: string;
    givenName: string;
}

interface Passenger {
    isDefault: boolean;
    passengerId: string;
    passengerKey: string;
    ptc: string;
    age: string;
    passengerInfo: PassengerInfo;
    identityDocuments: IdentityDocument[];
    contact: Contact;
}

interface FlightSegment {
    segmentKey: string;
    departureAirportCode: string;
    departureDateTime: string;
    departureTerminal?: string;
    arrivalAirportCode: string;
    arrivalDateTime: string;
    arrivalTerminal?: string;
    duration: string;
    flightNumber: string;
    resBookDesigCode: string;
    numberInParty: number;
    operatingAirline: string;
    marketingAirline: string;
    seatsAvailable: string;
    fareBasis: string;
    equipmentType: string;
    baggageAllowance: {
        carryOnBaggage: {
            paxType: string;
            value: string;
            unit: string;
            description: string;
        }[];
        checkedInBaggage: {
            paxType: string;
            value: string;
            unit: string;
        }[];
    };
    cabinClass: string;
}

interface FlightInfo {
    flightKey: string;
    flightInfo: {
        duration: string;
    };
    segmentReference: {
        onPoint: string;
        offPoint: string;
    };
    stopQuantity: number;
}

interface Flight {
    flight: FlightInfo;
    flightSegments: FlightSegment[];
}

export interface IProvBooking {
    offerId: string;
    conversationId: string;
    details: {
        ancillaryDetailsAvailable: boolean;
        lcc: boolean;
        apis: boolean;
        ndc: boolean;
        onHoldSupported: boolean;
        moreFaresAvailable: boolean;
        reissueSupported: boolean;
        fareRuleMandatory: boolean;
    };
    passengers: Passenger[];
    customerInfo: {
        emailAddress: string;
    };
    journey: Flight[];
}

interface FlightData {
    offerId: string;
    priceChanged: boolean;
    oldFare: number;
    newFare: number;
    detail: {
        ancillaryDetailsAvailable: boolean;
        lcc: boolean;
        apis: boolean;
        ndc: boolean;
        onHoldSupported: boolean;
        moreFaresAvailable: boolean;
        reissueSupported: boolean;
        supplierLocator: string;
        airlineLocators: {
            airline: string;
            airlineLocator: string;
        }[];
        fareRuleMandatory: boolean;
    };
    journey: {
        flight: {
            flightKey: string;
            flightInfo: {
                duration: string;
            };
            segmentReference: {
                onPoint: string;
                offPoint: string;
            };
            stopQuantity: number;
        };
        flightSegments: {
            segmentKey: string;
            departureAirportCode: string;
            departureDateTime: string;
            departureTerminal?: string;
            arrivalAirportCode: string;
            arrivalDateTime: string;
            arrivalTerminal?: string;
            duration: string;
            flightNumber: string;
            status: string;
            resBookDesigCode: string;
            numberInParty: number;
            operatingAirline: string;
            marketingAirline: string;
            fareBasis: string;
            equipmentType: string;
            baggageAllowance: {
                checkedInBaggage: {
                    paxType: string;
                    value: string;
                    unit: string;
                }[];
            };
            cabinClass: string;
        }[];
    }[];
    financialInfo: {
        tmc: string;
        supplier: string;
        subSupplierCode: string;
    };
    fare: {
        fareKey: string;
        currencyCode: string;
        fareType: {
            fareCode: string;
            farePreference: string;
            preferenceContext: string;
            oid: string;
            refundable: boolean;
        };
        baseFare: number;
        totalTax: number;
        totalFare: number;
        platingAirlineCode: string;
        customerAdditionalFareInfo: {
            transactionFeeEarned: number;
            commissionEarned: number;
            markupEarned: number;
            discount: number;
            plbearned: number;
            incentiveEarned: number;
            tdsOnIncentive: number;
        };
        fareBreakdown: {
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
                totalFare: number;
                taxes: {
                    amount: number;
                    taxCode: string;
                }[];
                customerAdditionalFareInfo: {
                    transactionFeeEarned: number;
                    commissionEarned: number;
                    markupEarned: number;
                    discount: number;
                    plbearned: number;
                    incentiveEarned: number;
                    tdsOnIncentive: number;
                };
            };
        }[];
    };
}

export interface ProvBookingSuccess {
    conversationId: string;
    meta: {
        success: boolean;
        statusCode: number;
        statusMessage: string;
        actionType: string;
        conversationId: string;
    };
    commonData: {
        searchKey: string;
        productCode: string;
    };
    data: FlightData[];
    version: string;
}
