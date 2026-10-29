export type getSearchDetailsPayload = {
    userId: number;
    userType: string;

    Hotelcodes: string;
};
export type HotelSearch = {
    conversationId: string;
    hotelDetails: HotelResults;
    moreRooms: RoomResults;
};
type HotelPassenger = {
    Age: number;
    FirstName?: string;
    LastName?: string;
    Email?: string;
    Phoneno?: string;
};

export type RoomDetails = {
    HotelPassenger?: HotelPassenger[];
    NoOfAdults?: number;
    NoOfChild?: number;
};


export type RoomResults = {
    meta: {
        success: boolean;
        statusCode: number;
        statusMessage: string;
        actionType: string;
        conversationId: string;
    };
    commonData: {
        searchKey: string;
        culture: string;
    };
    data: roomDetails[];
};

export type HotelResults = {
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
    data: HotelDetail[];
    // |roomDetails[];

    version: string;
};
export type roomDetails = {
    HotelPassenger: any;
    hotelKey: string;
    roomSelectionRules: [];
    rooms: Room[];
    roomCombinations: any;
};
export type Room = {
    roomIndex: number;
    roomKey: string;
    roomId: string;
    ruleInfo: string;
    roomTypeDesc: string;
    maxOccupancy: number;
    ratePlan: RatePlan;
    roomRate: RoomRate;
    rateNotes: string;
    financialInfo: {
        supplier: string;
    };
};
export type RatePlan = {
    supplierCode: string;
    meal: string;
    availableStatus: string;
    cancelPolicyIndicator: string;
    code: string;
    isPackage: boolean;
    fixedCombo: boolean;
    combinePolicy: boolean;
    gstAssured: boolean;
    lastCancellationDate: string;
};
export type Rate = {
    name: string;
    amount: number;
    from: string;
    rateIndex: string;
    to: string;
};
export type RoomRate = {
    currency: string;
    netAmount: number;
    rates: Rate[];
};
export type HotelImage = {
    order: number;
    type: string;
    description: string;
    path: string;
};
export type HotelDetail = {
    rooms: any;
    name: string;
    description: string;
    starRating: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    latitude: string;
    longitude: string;
    email: string;
    website: string;
    location: string;
    locationDesc: string;
    map: string;
    checkInTime: string;
    checkOutTime: string;
    childPolicy: string;
    userRating: string;
    hotelFacilities: string[]; // You might want to replace this with the actual type of hotel facilities
    images: HotelImage[];
    phoneNumber: string;
    currency: string;
};
