import { PayloadAction, createSlice } from '@reduxjs/toolkit';

// eslint-disable-next-line import/no-cycle
import { ApplicationListItem } from '../apis';
import { Service } from '../types';

interface GovernmentServicesState {
    selectedApplication: ApplicationListItem | null;
    selectedService: Service | null;
    servicesList: Service[];
    // customer_id resolved by purchase's Create Lead call (doc §6), returned
    // from createVendorBusinessApi during ServiceDetail's Continue step —
    // stored here (rather than passed as a plain function argument) so it
    // survives the navigate() into the shared payment page, which reads it
    // back out via useGovtServicePayment for the vendor Create Order call
    // (doc §19).
    vendorGid: string | null;
}

const initialState: GovernmentServicesState = {
    selectedApplication: null,
    selectedService: null,
    servicesList: [],
    vendorGid: null,
};

const governmentServicesSlice = createSlice({
    name: 'governmentServices',
    initialState,
    reducers: {
        setSelectedApplication: (state, action: PayloadAction<ApplicationListItem>) => {
            state.selectedApplication = action.payload;
        },
        clearSelectedApplication: (state) => {
            state.selectedApplication = null;
        },
        setSelectedService: (state, action: PayloadAction<Service>) => {
            state.selectedService = action.payload;
        },
        setServicesList: (state, action: PayloadAction<Service[]>) => {
            state.servicesList = action.payload;
        },
        setVendorGid: (state, action: PayloadAction<string | null>) => {
            state.vendorGid = action.payload;
        },
    },
});

export const { setSelectedApplication, clearSelectedApplication, setSelectedService, setServicesList, setVendorGid } = governmentServicesSlice.actions;
export default governmentServicesSlice.reducer;
