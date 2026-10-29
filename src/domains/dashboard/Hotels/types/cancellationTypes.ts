export type HotelCancellationPolicy = {
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
        culture: string;
    };
    data: cancelpolicyRoom[];
    version: string;
};

export type cancelpolicyRoom = {
    hotelKey: string;
    roomIndex: number[];
    roomKey: string;
    description: string;
    noShowPolicyDetail: {
        noShowPolicyType: string;
        noShowPolicyCharge: number;
    };
    isCombinePolicy: boolean;
    cancellationDeadlineDate: string;
    roomCombId: string;
};

export type cancellationPolicyResponse = {
    userId: number;
    userType: string;
    rooms: roomDatas[];
    hotelKey: string;
    searchKey: string;
    conversationId: string;
    culture: string;
};
export type roomDatas = {
    roomIndex: number;
    roomKey: string;
};

export type paymentRequest = {
    userId: number;
    userType: string;
    conversationId: string;
    hotelKey: string;
    searchKey: string;
    clientReference: string;
    hotelContact: hotelContacts;
    totalAmt: number;
    stayDateRange: dateRange;
    bookingKey: string;
    rooms: any;
};

export type hotelContacts = {
    email: string;
    phoneNumber: string;
    checkInTime: string;
    checkOutTime: string;
    image: string;
    address: string;
    city: string | undefined;
    country: string | undefined;
};
export type dateRange = {
    checkIn: string;
    checkOut: string;
};

export interface CancellationData {
    ChargeType: string;

    CancellationCharge: number;

    FromDate: string; // Add the FromDate property
}

export type CancellationCharge = {
    supplierCancellationCharge: number;
    totalCancellationCharges: number;
    adminCancellationCharge: number;
};
export type otpPayload = {
    userId: number;
    userType: string;
    scope: string;
};
