export type HotelBookingResponse = {
    conversationId: string;
    meta: {
        success: boolean;
        statusCode: number;
        statusMessage: string;
        actionType: string;
        conversationId: string;
    };
    data: HotelBooking[];
    cancellationPolicy: any;
    version: string;
};

export type HotelBooking = {
    hotel: {
        hotelKey: string;
        bookingKey: string;
        name: string;
        totalNet: number;
        currency: string;
        checkInDate: string;
        checkOutDate: string;
        priceChangeIndicator: boolean;
        rooms: HotelRoom[];
    };
    mandatoryBookData: {
        taxDetail: boolean;
        PassportDetails: passportType;
    };
};

export type passportType = {
    isPassportMandatory: boolean;
    isCrpPassportMandatory: boolean;
};

export type HotelRoom = {
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
};
