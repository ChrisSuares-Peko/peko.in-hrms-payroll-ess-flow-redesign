import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { PassengerInfo, SelectedSeatData, SelectedTripInfo } from '../types/buslist';

export type BoardingPoint = {
    address: string;
    bpId: string;
    bpName: string;
    contactNumber: string;
    landmark: string;
    location: string;
    prime: string;
    time: string;
};

export type FareDetail = {
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

export type RawTrip = {
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
    fareDetails: FareDetail | FareDetail[];
    boardingTimes: BoardingPoint | BoardingPoint[];
    droppingTimes: BoardingPoint | BoardingPoint[];
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

export type BusSearchData = {
    agentMappedToCp: string;
    agentMappedToEarning: string;
    availableTrips: RawTrip[];
};

export type TravellerFormValues = {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    countryCode: string;
    phone: string;
    email: string;
    idType: string;
    idNumber: string;
    address: string;
    employee?: string;
};

interface BusTicketState {
    searchData: BusSearchData | null;
    selectedSeats: string[];
    selectedSeatData: SelectedSeatData[];
    selectedTripInfo: SelectedTripInfo | null;
    passengers: PassengerInfo[];
    travellerForms: TravellerFormValues[];
    sourceId: string;
    destinationId: string;
    from: string;
    to: string;
    doj: string;
    blockKey: string;
    blockTime: number;
    blockInitiatedAt: string | null;
    contactPhone: string;
    contactEmail: string;
}

const initialState: BusTicketState = {
    searchData: null,
    selectedSeats: [],
    selectedSeatData: [],
    selectedTripInfo: null,
    passengers: [],
    travellerForms: [],
    sourceId: '',
    destinationId: '',
    from: '',
    to: '',
    doj: '',
    blockKey: '',
    blockTime: 8 * 60,
    blockInitiatedAt: null,
    contactPhone: '',
    contactEmail: '',
};

export const busTicketSlice = createSlice({
    name: 'busTicket',
    initialState,
    reducers: {
        setBusSearchResponse: (state, action: PayloadAction<BusSearchData>) => {
            state.searchData = action.payload;
        },
        setSelectedSeats: (state, action: PayloadAction<string[]>) => {
            state.selectedSeats = action.payload;
        },
        setSelectedSeatData: (state, action: PayloadAction<SelectedSeatData[]>) => {
            state.selectedSeatData = action.payload;
        },
        setSearchCities: (state, action: PayloadAction<{ sourceId: string; destinationId: string; from: string; to: string; doj: string }>) => {
            state.sourceId = action.payload.sourceId;
            state.destinationId = action.payload.destinationId;
            state.from = action.payload.from;
            state.to = action.payload.to;
            state.doj = action.payload.doj;
        },
        setBlockKey: (state, action: PayloadAction<string>) => {
            state.blockKey = action.payload;
        },
        setBlockData: (state, action: PayloadAction<{ blockKey: string; blockTime: number }>) => {
            state.blockKey = action.payload.blockKey;
            state.blockTime = action.payload.blockTime || 8 * 60;
            state.blockInitiatedAt = new Date().toISOString();
        },
        setSelectedTripInfo: (state, action: PayloadAction<SelectedTripInfo>) => {
            state.selectedTripInfo = action.payload;
        },
        setPassengers: (state, action: PayloadAction<PassengerInfo[]>) => {
            state.passengers = action.payload;
        },
        setTravellerForms: (state, action: PayloadAction<TravellerFormValues[]>) => {
            state.travellerForms = action.payload;
        },
        setContactDetails: (state, action: PayloadAction<{ contactPhone: string; contactEmail: string }>) => {
            state.contactPhone = action.payload.contactPhone;
            state.contactEmail = action.payload.contactEmail;
        },
        clearBusSearchResponse: () => initialState,
        clearBusResults: (state) => {
            state.searchData = null;
            state.selectedSeats = [];
            state.selectedSeatData = [];
            state.selectedTripInfo = null;
            state.passengers = [];
            state.travellerForms = [];
            state.blockKey = '';
            state.blockTime = 8 * 60;
            state.blockInitiatedAt = null;
            state.contactPhone = '';
            state.contactEmail = '';
        },
    },
});

export const {
    setBusSearchResponse,
    setSelectedSeats,
    setSelectedSeatData,
    setSelectedTripInfo,
    setPassengers,
    setTravellerForms,
    setContactDetails,
    setSearchCities,
    setBlockKey,
    setBlockData,
    clearBusSearchResponse,
    clearBusResults,
} = busTicketSlice.actions;
export default busTicketSlice.reducer;
