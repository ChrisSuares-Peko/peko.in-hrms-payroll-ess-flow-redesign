export type BestOption = 'cheapest' | 'earliest' | 'fastest' | null;

export type RawBoardingPoint = {
    address: string;
    bpId: string;
    bpName: string;
    contactNumber: string;
    landmark: string;
    location: string;
    prime: string;
    time: string;
};

export type RawFareDetail = {
    bankTrexAmt: string;
    baseFare: string;
    bookingFee: string;
    childFare: string;
    gst: string;
    levyFare: string;
    markupFareAbsolute: string;
    markupFarePercentage: string;
    opFare: string;
    opGroupFare: string;
    operatorServiceChargeAbsolute: string;
    operatorServiceChargePercentage: string;
    seatType: string;
    serviceCharge: string;
    serviceTaxAbsolute: string;
    serviceTaxPercentage: string;
    srtFee: string;
    tollFee: string;
    totalFare: string;
};

export type RawAvailableTrip = {
    id: string;
    travels: string;
    busType: string;
    busTypeId: string;
    busRoutes: string;
    operator: string;
    routeId: string;
    rbServiceId: string;
    source: string;
    destination: string;
    doj: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    nextDay: string;
    availableSeats: string;
    availableSingleSeat: string;
    avLowerSeats: string;
    avUpperSeats: string;
    avlWindowSeats: string;
    fares: string | string[];
    fareDetails: RawFareDetail | RawFareDetail[];
    boardingTimes: RawBoardingPoint | RawBoardingPoint[];
    droppingTimes: RawBoardingPoint | RawBoardingPoint[];
    AC: string;
    nonAC: string;
    sleeper: string;
    seater: string;
    liveTrackingAvailable: string;
    zeroCancellationTime: string;
    cancellationPolicy: string;
    cancellationCalculationTimestamp: string;
    partialCancellationAllowed: string;
    primaryPaxCancellable: string;
    bookable: string;
    busCancelled: string;
    maxSeatsPerTicket: string;
    idProofRequired: string;
    mTicketEnabled: string;
    noSeatLayoutEnabled: string;
    bpDpSeatLayout: string;
    dropPointMandatory: string;
    serviceStartTime: string;
    vehicleType: string;
    boCommission: string;
    partnerBaseCommission: string;
    agentServiceCharge: string;
    agentServiceChargeAllowed: string;
    happyHours: string;
    flashDealEnabled: string;
    offerPriceEnabled: string;
    groupOfferPriceEnabled: string;
    callFareBreakUpAPI: string;
    rtc: string;
    primo: string;
    powerOperator: string;
    boPriorityOperator: string;
    subscribedOperator: string;
    selfInventory: string;
    exactSearch: string;
    unAvailable: string;
    singleLadies: string;
    vaccinatedBus: string;
    vaccinatedStaff: string;
    gstApplicableOnTentative: string;
    otgEnabled: string;
    isLMBAllowed: string;
    additionalCommission: string;
    flatComApplicable: string;
    flatSSComApplicable: string;
    gdsCommission: string;
    tatkalTime?: string;
    cpId?: string;
    imagesMetadataUrl?: string;
    busImageCount?: string;
    SSAgentAccount?: string;
    availCatCard?: string;
    availSrCitizen?: string;
    amenities?: string;
    rating?: string;
    total_rating_count?: string;
    ratingsBreakUp?: Record<string, number>;
};

export type BusSearchQuery = {
    source: string;
    destination: string;
    doj: string;
};

export type BusSearchResponse = {
    agentMappedToCp: string;
    agentMappedToEarning: string;
    availableTrips: RawAvailableTrip[] | RawAvailableTrip;
    cftCutoff: string;
    femaleFreeSeatEnabled: string;
    lmbEnabled: string;
};

export type TripSeat = {
    available: string;
    baseFare: string;
    column: string;
    doubleBirth: string;
    fare: string;
    ladiesSeat: string;
    length: string;
    malesSeat: string;
    name: string;
    row: string;
    zIndex: string;
    reservedForSocialDistancing: string;
    width: string;
    window: string;
};

export type TripBoardingPoint = {
    address: string;
    bpId: string;
    bpName: string;
    city: string;
    cityId: string;
    contactNumber: string;
    landmark: string;
    location: string;
    locationId: string;
    prime: string;
    time: string;
};

export type TripDetails = {
    availableSeats: string;
    boardingTimes: TripBoardingPoint | TripBoardingPoint[];
    droppingTimes: TripBoardingPoint | TripBoardingPoint[];
    seats: TripSeat[];
    fareDetails: {
        seatType: string;
        totalFare: string;
        baseFare: string;
        gst: string;
    }[];
};

export type BpDpPoint = {
    id: string;
    name: string;
    locationName: string;
    address: string;
    landmark: string;
    contactnumber: string;
    rbMasterId: string;
};

export type BpDpDetails = {
    boardingPoints: BpDpPoint | BpDpPoint[];
    droppingPoints: BpDpPoint | BpDpPoint[];
};

export type StopPoint = {
    id: string;
    name: string;
    time: string;
    date: string;
    address: string;
    landmark?: string;
};

export type SelectedTripInfo = {
    operator: string;
    busType: string;
    from: string;
    to: string;
    departTime: string;
    arrivalTime: string;
    departDate: string;
    arrivalDate?: string;
    duration: string;
    departStop: string;
    arrivalStop: string;
    busId: string;
    boardingPointId: string;
    droppingPointId: string;
    cancellationPolicy: string;
    rating?: number;
    ratingCount?: number;
};

export type PassengerInfo = {
    id: number;
    name: string;
    idType: string;
    idNumber: string;
    seat: string;
    ticketNumber: string;
    email: string;
};

export type SelectedSeatData = {
    seatName: string;
    fare: number;
    ladiesSeat: boolean;
};

export type BlockPassenger = {
    name: string;
    age: number;
    mobile: number;
    title: string;
    email: string;
    gender: string;
    idType: string;
    idNumber: string;
    address: string;
    primary: string;
};

export type InventoryItem = {
    seatName: string;
    fare: number;
    ladiesSeat: string;
    passenger: BlockPassenger;
};

export type BookTicketResponse = {
    tinNos: string[];
    [key: string]: unknown;
};

export type BlockFareBreakup = {
    updatedFare: number;
    updatedServiceTax: number;
    updatedOperatorServiceCharge: number;
    previousFare: number;
    otherCharges: number;
    convenienceFee: number;
    bookingFee: number;
    reservationFee: number;
    tollFee: number;
    asnFare: number;
    streakDiscount: number;
    streakSeatWiseDiscountBreakup: Record<string, unknown>;
    seatWiseDiscountBreakup: Record<string, unknown>;
    serviceCharge: number;
    whatsappDiscount: number;
    boConcessionAmount: number;
    fareBreakup: { fareBreakups: unknown[] };
    serviceTaxSplit: Record<string, number>;
};

export type BlockTicketResponse = {
    blockKey: string;
    fareBreakup: BlockFareBreakup;
    inventoryItems: unknown[];
    blockTime: number;
};

export type BlockTicketPayload = {
    availableTripId: string;
    boardingPointId: number;
    droppingPointId: number;
    source: number;
    destination: number;
    inventoryItems: InventoryItem[];
};

export type BusBooking = {
    id: string;
    pnrNumber: string;
    confirmationNumber: string;
    bookingDate?: string;
    operator: string;
    busType: string;
    departureTime: string;
    departureDate: string;
    departureLocation: string;
    arrivalTime: string;
    arrivalDate: string;
    arrivalLocation: string;
    duration: string;
    stops: string;
    routeFrom?: string;
    routeTo?: string;
    ticketId?: string;
    status?: string;
    orderStatus?: string;
    amount?: string;
    seats?: string[];
    cancellationPolicy?: string;
};

export type CancelBookingResponse = {
    status: boolean;
    message: string;
    responseCode: string;
    data: {
        refundAmount?: number;
        corporateFinalBalance?: number;
    };
};

export type RawBusBookingItem = {
    id: number;
    corporateTxnId: string;
    tin: string;
    amount: string;
    paymentMode: string;
    status: string;
    orderStatus: string;
    transactionDate: string;
    bookingDetails: null | Record<string, unknown>;
};

export type BusBookingsResponse = {
    bookings: RawBusBookingItem[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type BusCity = {
    id: number;
    name: string;
    state: string;
    stateId: number;
    latitude: number;
    longitude: number;
    locationType: string;
};

export type BusData = {
    id: string;
    operator: string;
    type: string;
    rating: number;
    ratings: number;
    liveTracking: boolean;
    departCity: string;
    departTime: string;
    departDate: string;
    arrivalCity: string;
    arrivalTime: string;
    arrivalDate: string;
    duration: string;
    seats: number;
    single: number;
    price: number;
    originalPrice: number;
    isAC: boolean;
    isSleeper: boolean;
    isSeater: boolean;
    hasFreeCancellation: boolean;
    bpDpSeatLayout: boolean;
    amenities: string[];
    cancellationPolicy?: string;
    imagesMetadataUrl?: string;
    busImageCount?: string;
};
