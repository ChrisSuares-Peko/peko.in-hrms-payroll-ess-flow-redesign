import { Journey } from './airlineList';

export type IOrderResponse = {
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
    data: {
        bookingStatus: string;
        priceChanged: boolean;
        bookingReferenceId: string;
        supplierLocator: string;
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
                stopQuantity: string;
            };
            flightSegments: {
                segmentKey: string;
                departureAirportCode: string;
                departureDateTime: Date;
                departureTerminal: string;
                arrivalAirportCode: string;
                arrivalDateTime: Date;
                arrivalTerminal: string;
                duration: number;
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
        passengers: {
            passengerKey: string;
            ptc: string;
            passengerInfo: {
                gender: string;
                nameTitle: string;
                givenName: string;
                surname: string;
            };
            identityDocuments: {
                idDocumentNumber: string;
                idType: string;
                issuingCountryCode: string;
                residenceCountryCode: string;
                expiryDate: string;
            }[];
            contact: {
                contactsProvided: {
                    emailAddress: string[];
                    phone: {
                        label: string;
                        areaCode: string;
                        phoneNumber: string;
                    }[];
                }[];
            };
            airlineRequests: {
                ssr: {
                    name: string;
                    code: string;
                    text: string;
                    status?: string;
                }[];
                osi: any[];
            };
        }[];
        fare: {
            fareKey: string;
            currencyCode: string;
            fareType: {
                fareCode: string;
                farePreference: string;
                preferenceContext: string;
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
        ticketDocument: {
            passengerKey: string;
            fareBreakdownKey: string;
            airline: string;
            status: string;
            dateOfIssue: string;
            lastTicketDate: string;
            airlineLocators: {
                airline: string;
                airlineLocator: string;
            }[];
        }[];
    }[];
    version: string;
};

export type IBooking = {
    id: string;
    corporateTxnId: string;
    operatorId: string;
    providerId: string | null;
    transactionDate: string;
    accountNo: null;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: string;
    paymentModeResponse: string | null;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: any[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
};

export type IBookingRes = {
    page: number;
    limit: number;
    count: number;
    bookings: IBooking[];
};

export type BookingDetailsRes = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string | null;
    amountInINR: string;
    baseAmount: string;
    paymentMode: string;
    orderResponse: any; // Typing as any for flexibility
    paymentModeResponse: any | null;
    surcharge: string;
    baseCurrency: string;
    exchangeRate: string;
    status: string;
    message: string;
    ecomOrderStatus: string;
    workspaceOrderStatus: string;
    shipmentStatus: string[];
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
};

export type BookingListRes = {
    bookings: Booking[];
    count: number;
    limit: number;
    page: number;
};

export type Booking = {
    id: number;
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
    inbountJourney: Journey[];
    pnr: string;
    inbountBookingId?: string;
    inbountPNR?: string;
    bookingId: string;
    TraceId: string;
    BookingId: string;
    PNR: string;
    bookingStatus: string;
    transaction: Transaction;
    orderId: number;
    createdAt: string;
};

export type Transaction = {
    id: number;
    corporateTxnId: string;
};

export type BookingList = {
    id: number;
    corporateTxnId: string;
    TraceId: string;
    logo: string;
    flightName: string;
    bookingId: string;
    pnr: string;
    inbountBookingId?: string;
    inbountPnr?: string;
    flightClass: number;
    flightDuration: number;
    stopCount: number;
    status: string;
    depart: {
        datetime: string;
        terminal: string;
        airport: string;
    };
    arrive: {
        datetime: string;
        terminal: string;
        airport: string;
    };
    journey: Journey[];
    inbountJourney: Journey[];
    transaction: Transaction;
    bookingCurrentStatus: string;
    orderId: number;
    bookingDate: string;
};

export type CancelationCharge = {
    RefundAmount?: number;
    CancellationCharge?: number;
};
