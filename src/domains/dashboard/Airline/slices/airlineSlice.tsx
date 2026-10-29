import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    InitialState,
    RemovePassengerPayload,
    SearchFilter,
    SetPassengerPayload,
} from '../types/slices';

const initialState: InitialState = {
    formData: {
        tripType: '',
        flightSegments: [
            {
                Origin: '',
                Destination: '',
                FlightCabinClass: 2,
                PreferredDepartureTime: '',
            },
        ],
        passengerData: {
            adultCount: 0,
            childCount: 0,
            infantCount: 0,
        },
    },
    searchData: {
        tripType: 1,
        fromLocation: '',
        toLocation: '',
        depart: '',
        departDay: '',
        arrive: '',
        arriveDay: '',
        fromLocation1: '',
        toLocation1: '',
        depart1: '',
        departDay1: '',
        arrive1: '',
        arriveDay1: '',
        adults: 1,
        children: 0,
        infants: 0,
        class: 5,
        originCountryCode: '',
        destinationCountryCode: '',
    },
    selectedAirline: {
        id: 0,
        logo: '',
        flightName: '',
        flightNumber: '',
        operatingAirline: '',
        ResultIndex: '',
        flightDuration: 0,
        onPoint: '',
        offPoint: '',
        price: 0,
        totalTax: 0,
        flightClass: 1,
        flightCode: '',
        stopCount: 0,
        lcc: false,
        journey: [],
        arrive: {
            datetime: '',
        },
        depart: {
            datetime: '',
        },
    },
    selectedInbountAirline: {
        id: 0,
        logo: '',
        flightName: '',
        flightNumber: '',
        operatingAirline: '',
        ResultIndex: '',
        flightDuration: 0,
        onPoint: '',
        offPoint: '',
        price: 0,
        totalTax: 0,
        flightClass: 1,
        flightCode: '',
        stopCount: 0,
        lcc: false,
        journey: [],
        arrive: {
            datetime: '',
        },
        depart: {
            datetime: '',
        },
    },
    airlineData: {},
    bookingData: {
        passengers: [],
        customerInfo: {
            emailAddress: '',
            phone: '',
            phoneCode: '',
        },
        gstDetails: {
            GSTCompanyAddress: '',
            GSTCompanyContactNumber: '',
            GSTCompanyEmail: '',
            GSTCompanyName: '',
            GSTNumber: '',
        },
    },
    provBookingSuccess: {},
    paymentSuccesResponse: {},
    ancillariesSearch: {},
    selectedAncillaries: {
        selectedAncillaries: [
            // {
            //     ancType: '',
            //     ancillaryOfferId: '',
            //     passengerKey: '',
            //     segmentKey: '',
            //     itemPrice: 0,
            // },
        ],
        conversationId: '',
        isLcc: true,
        offerId: '',
    },
    quickUpdateData: {
        date: '',
        tripType: '',
    },
    PNR: '',
    BookingId: '',
    TraceId: '',
    fairRulesData: [],
    flightResponse: [],
    inbountFlightResponse: [],
    priceRange: {},
    paymentData: null,
    orderDetails: {
        id: 0,
        bookingStatus: '',
        orderId: '',
        PNR: '',
        inbountPNR: '',
        inbountBookingId: '',
        passengers: [],
        journey: [],
        BookingId: '',
        inbountBookingStatus: '',
    },
    isContactInfoValid: false,
    contactInfoPassenger: '',
    isGSTDetailsValid: false,
    searchFilter: {
        startValue: 0,
        endValue: 0,
        airlineRadioValue: [],
        airlineTimeRadioValue: [],
        layoverVal: [],
    },
    outbountFare: 0,
    inbountFare: 0,
    searchInitiatedAt: null,
    bookingCompletedAt: null,
};

const airlineFormSlice = createSlice({
    name: 'airline',
    initialState,
    reducers: {
        setFormData: (state, action: PayloadAction<any>) => {
            state.formData = { ...state.formData, ...action.payload };
        },
        setSearchData: (state, action: PayloadAction<any>) => {
            state.searchData = { ...state.searchData, ...action.payload };
        },
        setTraceId: (state, action: PayloadAction<any>) => {
            state.TraceId = action.payload;
            state.searchInitiatedAt = action.payload ? new Date().toISOString() : null;
        },
        setBookingCompletedAt: (state, action: PayloadAction<string | null>) => {
            state.bookingCompletedAt = action.payload;
        },
        resetSessionTimer: state => {
            state.searchInitiatedAt = null;
            state.bookingCompletedAt = null;
        },
        resetSelectAirline: state => {
            state.selectedAirline = initialState.selectedAirline;
        },
        setSelectedAirline: (state, action: PayloadAction<any>) => {
            state.selectedAirline = { ...state.selectedAirline, ...action.payload };
        },
        resetSelectedInbountAirlne: state => {
            state.selectedInbountAirline = initialState.selectedInbountAirline;
        },
        setSelectedInbountAirline: (state, action: PayloadAction<any>) => {
            state.selectedInbountAirline = { ...state.selectedInbountAirline, ...action.payload };
        },
        resetSelectedAirlines: (state, action: PayloadAction<any>) => {
            state.selectedAirline = initialState.selectedAirline;
            state.selectedInbountAirline = initialState.selectedInbountAirline;
        },
        setProvBooking: (state, action: PayloadAction<any>) => {
            state.bookingData = { ...state.bookingData, ...action.payload };
        },
        setAirlineData: (state, action: PayloadAction<any>) => {
            state.airlineData = { ...state.airlineData, ...action.payload };
        },
        setPNRandBookingId: (state, action: PayloadAction<any>) => {
            state.PNR = action.payload.PNR;
            state.BookingId = action.payload.BookingId;
        },
        setPassengerAncillaries: (state, action: PayloadAction<SetPassengerPayload>) => {
            const { passengerId, anc, ancType } = action.payload;
            const existingPassengerIndex = state.bookingData.passengers.findIndex(
                passenger => passenger.passengerId === passengerId
            );
            if (existingPassengerIndex !== -1) {
                // @ts-ignore
                state.bookingData.passengers[existingPassengerIndex][ancType] = anc;
            }
        },
        removePassengerAncillaries: (state, action: PayloadAction<RemovePassengerPayload>) => {
            const { passengerId, ancType, index } = action.payload;
            const existingPassengerIndex = state.bookingData.passengers.findIndex(
                passenger => passenger.passengerId === passengerId
            );
            if (existingPassengerIndex !== -1) {
                const ancData = state.bookingData.passengers[existingPassengerIndex][ancType];
                // @ts-ignore
                state.bookingData.passengers[existingPassengerIndex][ancType] = [
                    ...ancData.slice(0, index),
                    ...ancData.slice(index + 1),
                ];
            }
        },
        addCustomerInfo: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            state.bookingData.customerInfo.emailAddress = data.email;
            state.bookingData.customerInfo.phone = data.phone;
            state.bookingData.customerInfo.phoneCode = data.phoneCode;
        },
        setContactInfoValid: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            state.isContactInfoValid = data.isContactInfoValid;
        },
        setContactInfoPassenger: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            state.contactInfoPassenger = data.contactInfoPassenger;
        },
        setGSTDetails: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            state.bookingData.gstDetails = data;
        },
        setGSTDetailsValid: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            state.isGSTDetailsValid = data.isGSTDetailsValid;
        },
        // setOfferId: (state, action: PayloadAction<any>) => {
        //     state.bookingData.offerId = action.payload;
        // },
        // setconversationId: (state, action: PayloadAction<any>) => {
        //     state.bookingData.conversationId = action.payload;
        // },
        // setProvBookingDetails: (state, action: PayloadAction<any>) => {
        //     state.bookingData.details = action.payload;
        // },
        // setProvBookingJourney: (state, action: PayloadAction<any>) => {
        //     state.bookingData.journey = action.payload;
        // },
        addPassengersData: (state, action: PayloadAction<any>) => {
            const data = action.payload;
            const { passengerId } = data;
            const existingPassengerIndex = state.bookingData.passengers.findIndex(
                passenger => passenger.passengerId === passengerId
            );
            if (existingPassengerIndex !== -1) {
                state.bookingData.passengers[existingPassengerIndex] = {
                    ...state.bookingData.passengers[existingPassengerIndex],
                    ...data,
                };
            } else {
                state.bookingData.passengers.push(data);
            }
        },
        resetBookingData: (state, action: PayloadAction<any>) => {
            state.bookingData = initialState.bookingData;
            state.contactInfoPassenger = '';
        },
        setProvBookingSuccess: (state, action: PayloadAction<any>) => {
            state.provBookingSuccess = action.payload;
        },
        setPaymentSuccessResponse: (state, action: PayloadAction<any>) => {
            state.paymentSuccesResponse = action.payload;
        },
        setAncillariesSearch: (state, action: PayloadAction<any>) => {
            state.ancillariesSearch = action.payload;
        },
        setAncillariesConversationId: (state, action: PayloadAction<any>) => {
            state.selectedAncillaries.conversationId = action.payload;
        },
        setAncillariesOfferId: (state, action: PayloadAction<any>) => {
            state.selectedAncillaries.offerId = action.payload;
        },
        setSelectedAncillaries: (state, action: PayloadAction<any>) => {
            const { ancType, segmentKey } = action.payload;
            const existingAnc = state.selectedAncillaries.selectedAncillaries.findIndex(
                anc => anc.ancType === ancType && anc.segmentKey === segmentKey
            );
            if (existingAnc !== -1) {
                state.selectedAncillaries.selectedAncillaries[existingAnc] = action.payload;
            } else {
                if (state.selectedAncillaries.selectedAncillaries[0].ancType === '') {
                    state.selectedAncillaries.selectedAncillaries[0] = action.payload;
                }
                state.selectedAncillaries.selectedAncillaries.push(action.payload);
            }
        },
        setQuickUpdateDate: (state, action: PayloadAction<any>) => {
            state.quickUpdateData.date = action.payload;
        },
        setQuickUpdateTripType: (state, action: PayloadAction<any>) => {
            state.quickUpdateData.tripType = action.payload;
        },
        resetFormState: () => initialState,
        resetpriceRange: state => {
            state.priceRange = initialState.priceRange;
            return state;
        },
        setfilghtResponse: (state, action: PayloadAction<any>) => {
            state.flightResponse = action.payload;
        },
        setInbountFlightResponse: (state, action: PayloadAction<any>) => {
            state.inbountFlightResponse = action.payload;
        },
        setPriceRange: (state, action: PayloadAction<any>) => {
            state.priceRange = action.payload;
        },
        resetSelectedAncillaries: state => {
            state.selectedAncillaries.selectedAncillaries = [];
        },
        setPaymentDetails: (state, action: PayloadAction<any>) => {
            state.paymentData = action.payload;
        },
        updatePaymentDetailsPassenger: (state, action: PayloadAction<any>) => {
            if (state.paymentData.payload) {
                state.paymentData.payload.passengers = action.payload;
            }
        },
        resetPaymentDetails: state => {
            state.paymentData = null;
        },
        setSelectedOrderDetails: (state, action: PayloadAction<any>) => {
            state.orderDetails = { ...action.payload };
        },
        updateSearchFilter: (state, action: PayloadAction<SearchFilter>) => {
            state.searchFilter = action.payload;
        },
        resetFilter: state => {
            state.searchFilter = initialState.searchFilter;
        },
        setFares: (state, action: PayloadAction<any>) => {
            state.outbountFare = action.payload.outbountFare;
            state.inbountFare = action.payload.inbountFare;
        },
    },
});

export const {
    setFormData,
    resetFormState,
    setSelectedAirline,
    resetSelectAirline,
    setSelectedInbountAirline,
    resetSelectedInbountAirlne,
    setProvBooking,
    addPassengersData,
    // addCustomerInfo,
    // setOfferId,
    // setconversationId,
    // setProvBookingDetails,
    // setProvBookingJourney,
    setAirlineData,
    setProvBookingSuccess,
    setPaymentSuccessResponse,
    setAncillariesSearch,
    setAncillariesConversationId,
    setSelectedAncillaries,
    resetSelectedAirlines,
    setAncillariesOfferId,
    setSearchData,
    setQuickUpdateDate,
    setQuickUpdateTripType,
    resetpriceRange,
    setfilghtResponse,
    setInbountFlightResponse,
    setPriceRange,
    resetSelectedAncillaries,
    setTraceId,
    setBookingCompletedAt,
    resetSessionTimer,
    setPaymentDetails,
    setPNRandBookingId,
    setPassengerAncillaries,
    removePassengerAncillaries,
    setSelectedOrderDetails,
    addCustomerInfo,
    setContactInfoValid,
    setContactInfoPassenger,
    resetBookingData,
    setGSTDetails,
    setGSTDetailsValid,
    updatePaymentDetailsPassenger,
    updateSearchFilter,
    resetFilter,
    setFares,
} = airlineFormSlice.actions;
export default airlineFormSlice.reducer;
