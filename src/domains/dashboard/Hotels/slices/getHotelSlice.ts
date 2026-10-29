import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { HotelRoom } from '../types/bookingTypes';
import { HotelCancellationPolicy } from '../types/cancellationTypes';
import { HotelSearch, Room } from '../types/hotelTypes';

interface formDetails {
    FirstName: string;
    LastName: string;
    Country: string;
    Mobile: string;
}

interface handleSubmit {
    City?: string;
    CheckIn: string;
    CheckOut: string;
    GuestNationality: string;
    country: string;
    cityName?: string;
}

interface count {
    type: 'adult' | 'child';
    increment: boolean;
    index: number;
}

interface roomdata {
    roomIndex: number;
    name: string;
    price: number;
    roomKey: string;
}

interface keys {
    conversationId: string;
}

interface BookingRoom {
    roomIndex: number;
    roomKey: string;
    passengerArray?: any[]; // Replace 'any[]' with the actual type of your passenger data
}

interface InitialState {
    hotelsRequest: any;
    hotelResponse: any | {};
    roomResponse: roomdata[];
    reservedData: Room[];
    formData: formDetails;
    bookingRoom: BookingRoom[];
    keyData: keys;
    cancelPolicy: HotelCancellationPolicy | {};
    corporateTxnId: string;
    bookingKey: string;
    prebookRoomData: HotelRoom[];
    userdetails: any[];

    formCount: any[];
    hotelArr: any;
    nationality: string;
    countryOfResidence: string;
    prebookResponse: any;
    netAmount: any;
    searchkey: string;
    totalForms: any;
    hotelPriceRange: any;
    singleData: any;
    supplements: any;
    customerInfo: {
        emailAddress: string;
        phone: string;
    };
    searchInitiatedAt:any
}

const initialState: InitialState = {
    hotelsRequest: {
        CheckIn: '',
        CheckOut: '',
        rooms: [{ adult: 1, child: 0, roomIndex: 1, childAge: [] }],
        GuestNationality: '',
    },
    bookingRoom: [],
    hotelResponse: {},
    roomResponse: [],
    reservedData: [],
    formData: {
        FirstName: '',
        LastName: '',
        Country: '',
        Mobile: '',
    },

    keyData: {
        conversationId: '',
    },
    cancelPolicy: {},
    corporateTxnId: '',
    bookingKey: '',
    prebookRoomData: [],
    userdetails: [],
    formCount: [],
    hotelArr: [],
    nationality: '',
    countryOfResidence: '',
    prebookResponse: {},
    netAmount: {},
    searchkey: '',
    totalForms: [],
    hotelPriceRange: {},
    singleData: {},
    supplements: [],
    customerInfo: {
        emailAddress: '',
        phone: '',
    },
     searchInitiatedAt: null,
};

export const getHotelSlice = createSlice({
    name: 'hotels',
    initialState,
    reducers: {
        setRoom: (state, action: PayloadAction<any>) => {
            if (action.payload.isAdd) {
                state.roomResponse.push(action.payload.roomInfo);
            } else {
                state.roomResponse = state.roomResponse.filter(
                    room => room.roomKey !== action.payload.roomInfo.roomKey
                );
            }
        },

        setRoomDetails: (state, action: PayloadAction<any>) => {
            state.reservedData = action.payload;
        },

        setKeys: (state, action: PayloadAction<keys>) => {
            state.keyData = action.payload;
        },
        getTxnId: (state, action: PayloadAction<string>) => {
            state.corporateTxnId = action.payload;
        },

        getBookingKey: (state, action: PayloadAction<string>) => {
            state.bookingKey = action.payload;
        },

        addRoom: state => {
            const index = state.hotelsRequest.rooms.length + 1;
            state.hotelsRequest = {
                ...state.hotelsRequest,
                rooms: [
                    ...state.hotelsRequest.rooms,
                    { adult: 1, child: 0, roomIndex: index, childAge: [] },
                ],
            };
        },

        addChildAge: (
            state,
            action: PayloadAction<{ roomIndex: number; childAge: number; ageIndex: number }>
        ) => {
            const { roomIndex, childAge, ageIndex } = action.payload;
            state.hotelsRequest.rooms[roomIndex].childAge[ageIndex] = childAge;
        },
        handleCount: (state, action: PayloadAction<count>) => {
            const { type, increment, index } = action.payload;

            const { rooms } = state.hotelsRequest;
            state.hotelsRequest.rooms[index] = {
                ...state.hotelsRequest.rooms[index],
                [type]: increment
                    ? state.hotelsRequest.rooms[index][type] + 1
                    : state.hotelsRequest.rooms[index][type] - 1,
                ...(type === 'child' && {
                    childAge: increment
                        ? [...(rooms[index].childAge as number[]), 0]
                        : rooms[index].childAge.slice(0, -1),
                }),
            };
        },

        deleteRoom: (state, action: PayloadAction<{ index: number }>) => {
            const { rooms } = state.hotelsRequest;
            rooms.splice(action.payload.index, 1);
            // eslint-disable-next-line no-return-assign
            rooms.forEach((room: any, index: any) => (room.roomIndex = index + 1));
            state.hotelsRequest = { ...state.hotelsRequest, rooms };
        },

        setRooms: (state, action: PayloadAction<any[]>) => {
            state.hotelsRequest = { ...state.hotelsRequest, rooms: action.payload };
        },

        getHotels: (state, action: PayloadAction<handleSubmit>) => {
            state.hotelsRequest = { ...state.hotelsRequest, ...action.payload };
            return state;
        },

        getDetails: (state, action: PayloadAction<HotelSearch>) => {
            state.hotelResponse = { ...state.hotelResponse, ...action.payload };
              state.searchInitiatedAt = new Date().toISOString();
        },

        getCancelPolicy: (state, action: PayloadAction<HotelCancellationPolicy>) => {
            state.cancelPolicy = { ...state.cancelPolicy, ...action.payload };
        },

        setFormDetails: (state, action: PayloadAction<formDetails>) => {
            state.formData = { ...state.formData, ...action.payload };
        },

        getPrebookData: (state, action: PayloadAction<any>) => {
            state.prebookRoomData = action.payload;
        },

        addPassengersData: (state, action: PayloadAction<any>) => {
            state.bookingRoom = action.payload;
        },

        addUserData: (state, action: PayloadAction<any>) => {
            if (state.userdetails.find(user => user.roomIndex === action.payload.roomIndex)) {
                const details = state.userdetails.find(
                    user => user.roomIndex === action.payload.roomIndex
                );

                const roomIndex = state.userdetails.findIndex(
                    user => user.roomIndex === action.payload.roomIndex
                );

                if (
                    details.passengers.find(
                        (passenger: any) =>
                            passenger.passengerKey === action.payload.userdetails.passengerKey
                    )
                ) {
                    const index = details.passengers.findIndex(
                        (passenger: any) =>
                            passenger.passengerKey === action.payload.userdetails.passengerKey
                    );

                    state.userdetails[roomIndex].passengers[index] = action.payload.userdetails;
                } else {
                    state.userdetails[roomIndex].passengers.push(action.payload.userdetails);
                }
            } else {
                state.userdetails.push({
                    roomKey: action.payload.roomKey,
                    roomIndex: action.payload.roomIndex,
                    passengers: [action.payload.userdetails],
                });
            }
        },
        TotalFormCount: (state, action: PayloadAction<any>) => {
            state.formCount = action.payload;
        },
        setTotalForms: (state, action: PayloadAction<any>) => {
            state.totalForms = action.payload;
        },
        setSupplements: (state, action: PayloadAction<any>) => {
            state.supplements = action.payload;
        },

        setSearchKey: (state, action: PayloadAction<any>) => {
            state.searchkey = action.payload;
        },
        resetSearchKey: state => {
            state.searchkey = initialState.searchkey;
            return state;
        },
        resetTotalForms: state => {
            state.totalForms = initialState.totalForms;
            return state;
        },
        resetData: state => {
            state.hotelResponse = initialState.hotelResponse;
            return state;
        },
        resetUserDetails: state => {
            state.formCount = initialState.formCount;
            return state;
        },
        resetRoomResponse: state => {
            state.roomResponse = initialState.roomResponse;
            return state;
        },
        resetGetHotels: state => {
            state.hotelsRequest = initialState.hotelsRequest;
            return state;
        },
        sethotelArr: (state, action: PayloadAction<any>) => {
            state.hotelArr = action.payload;
        },
        resetHotelArr: state => {
            state.hotelArr = initialState.hotelArr;
            return state;
        },
        setTravelerNationality: (state, action: PayloadAction<any>) => {
            state.nationality = action.payload;
        },
        setcountryOfResidence: (state, action: PayloadAction<any>) => {
            state.countryOfResidence = action.payload;
        },
        setPrebookResponse: (state, action: PayloadAction<any>) => {
            state.prebookResponse = action.payload;
        },
        setNetAmount: (state, action: PayloadAction<any>) => {
            state.netAmount = action.payload;
        },
        resetNationality: state => {
            state.nationality = initialState.nationality;
            return state;
        },
        resetResidence: state => {
            state.countryOfResidence = initialState.countryOfResidence;
            return state;
        },
        resetUserData: state => {
            state.userdetails = initialState.userdetails;
            state.customerInfo = initialState.customerInfo;
            return state;
        },
        sethotelPriceRange: (state, action: PayloadAction<any>) => {
            state.hotelPriceRange = action.payload;
        },
        resethotelPriceRange: state => {
            state.hotelPriceRange = initialState.userdetails;
            return state;
        },
        setSingleData: (state, action: PayloadAction<any>) => {
            state.singleData = action.payload;
        },
        addCustomerInfo: (state, action: PayloadAction<any>) => {
            state.customerInfo = action.payload;
        },
        resetHotelBookingStartedAt: (state) => {
            state.searchInitiatedAt = null;
        }

    },
});

export const {
    getHotels,
    getDetails,
    addRoom,
    deleteRoom,
    setRoom,
    handleCount,
    setFormDetails,
    setKeys,
    getCancelPolicy,
    getTxnId,
    getBookingKey,
    addChildAge,
    setRoomDetails,
    addPassengersData,
    getPrebookData,
    addUserData,
    TotalFormCount,
    resetData,
    resetUserDetails,
    resetRoomResponse,
    resetGetHotels,
    sethotelArr,
    resetHotelArr,
    setTravelerNationality,
    setcountryOfResidence,
    setPrebookResponse,
    setNetAmount,
    resetNationality,
    resetResidence,
    setSearchKey,
    resetSearchKey,
    resetUserData,
    setTotalForms,
    resetTotalForms,
    sethotelPriceRange,
    resethotelPriceRange,
    setSingleData,
    setSupplements,
    addCustomerInfo,
    resetHotelBookingStartedAt,
    setRooms,
} = getHotelSlice.actions;
export default getHotelSlice.reducer;
