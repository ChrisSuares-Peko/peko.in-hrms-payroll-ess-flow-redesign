import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ServicesListResponse } from '@customtypes/general';
import { staticCorporateServiceAccess } from '@utils/staticCorporateServiceAccess';

interface ApiState {
    services: ServicesListResponse | null;
    servicesLoadFailed: boolean;
    isAdmin: boolean;
}

const initialState: ApiState = {
    // PROTOTYPE-SETUP: seed service access locally (hasAccess: true) so guards and sidebar work with no backend.
    services: { data: staticCorporateServiceAccess },
    servicesLoadFailed: false,
    isAdmin: false,
};

export const userSlice = createSlice({
    name: 'services',
    initialState,
    reducers: {
        setServices: (state, action: PayloadAction<Partial<ApiState>>) => {
            state = { ...state, ...action.payload };
            return state;
        },
    },
});

export const { setServices } = userSlice.actions;

export default userSlice.reducer;
