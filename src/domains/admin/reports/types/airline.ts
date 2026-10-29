type AirlineOrderResponse = {
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

// Define interfaces for the nested objects
interface Credential {
    id: number;
    username: string;
    name: string;
    email: string;
}

interface Order {
    id: number;
    amountInINR: number;
    baseAmount: string;
    status: string;
    paymentMode: string;
    orderResponse: AirlineOrderResponse;
    ecomOrderStatus: string;
}
export type Booking = {
    id: number;
    corporateTxnId: string;
    transactionDate: string; // Could be Date type if parsing is required
    debitAmount: string;
    status: string;
    credential: Credential;
    order: Order;
    BookingId: string;
    refundedAmount: string;
    bookingStatus: string;
};

export interface airlineDataResponse {
    count: number;
    bookings: Booking[];
}

export type RolePermissionAccessData = {
    view?: boolean;
    write?: boolean;
    update?: boolean;
};
