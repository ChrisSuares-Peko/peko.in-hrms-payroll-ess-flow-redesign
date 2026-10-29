export type bookingData = {
    page: number;
    limit: number;
    count: number;
    bookings: Booking[];
};

export type Booking = {
    id: number;
    corporateTxnId: string;
    operatorId: string;
    providerId: string;
    transactionDate: string;
    accountNo: string | null;
    amountInINR: string;
    baseAmount: number;
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
    shipmentStatus: string | null;
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number;
    credentialId: number;
};

export type HotelBooking = {
    bookingReferenceId: string;
    supplierReferenceId: string;
    clientReference: string;
    bookingStatus: string;
    transactionDate: string;
    hotel: {
        hotelKey: string;
        name: string;
        totalNet: number;
        currency: string;
        checkInDate: string;
        checkOutDate: string;
        rooms: {
            roomIndex: number;
            roomKey: string;
            roomId: string;
            roomTypeDesc: string;
            maxOccupancy: number;
            ratePlan: {
                supplierCode: string;
                meal: string;
                availableStatus: string;
                cancelPolicyIndicator: string;
                code: string;
                isPackage: boolean;
                fixedCombo: boolean;
                gstAssured: boolean;
            };
            roomRate: {
                currency: string;
                netAmount: number;
                rates: {
                    name: string;
                    amount: number;
                    from: string;
                    rateIndex: string;
                    to: string;
                }[];
            };
            rateNotes: string;
            financialInfo: {
                supplier: string;
            };
        }[];
    };
    passengers: {
        passengerKey: string;
        isLead: boolean;
        ptc: string;
        roomIndex: number;
        roomKey: string;
        passengerInfo: {
            birthDate: string;
            nameTitle: string;
            givenName: string;
            middleName: string;
            surname: string;
        };
        contact: {
            contactsProvided: {
                [key: string]: any;
            }[];
        };
    }[];
    voucherDocuments: {
        hotelConfirmationNumber: string;
        roomBookingInfo: {
            roomIndex: number;
            status: string;
        }[];
        essentialNotes: string[];
    }[];
};

export type ResponseHotelBookings = {
    meta: {
        success: boolean;
        statusCode: number;
        statusMessage: string;
        actionType: string;
        conversationId: string;
    };
    commonData: {
        productCode: string;
        culture: string;
    };
    data: HotelBooking[];

    hotelContact: {
        email: string;
        phoneNumber: string;
        checkInTime: string;
        checkOutTime: string;
        image: string;
        address: string;
        city: string;
        country: string;
    };
};
