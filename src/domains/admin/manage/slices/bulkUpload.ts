import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { SoftwareProductBulk } from '../types/subscription';
import { SoftwarePlansBulk } from '../types/subscriptionPlans';

interface BulkUploadType {
    softwareProductBulk: SoftwareProductBulk[];
    softwarePlanBulk: SoftwarePlansBulk[];
}

const initialStateData: BulkUploadType = {
    softwareProductBulk: [],
    softwarePlanBulk: [],
};

const bulkProductsSlice = createSlice({
    name: 'bulkUpload',
    initialState: initialStateData,
    reducers: {
        setBulkSoftwareProductsData: (state, action: PayloadAction<SoftwareProductBulk[]>) => {
            state.softwareProductBulk = action.payload;
        },
        setBulkSoftwarePlansData: (state, action: PayloadAction<SoftwarePlansBulk[]>) => {
            state.softwarePlanBulk = action.payload;
        },
        updateSoftwareProductBulkJson: (
            state,
            action: PayloadAction<{ index: number; updatedBulkData: SoftwareProductBulk }>
        ) => {
            const { index, updatedBulkData } = action.payload;
            if (index >= 0 && index < state.softwareProductBulk.length) {
                state.softwareProductBulk[index] = {
                    ...state.softwareProductBulk[index],
                    ...updatedBulkData,
                };
            }
        },
        updateSoftwarePlansBulkJson: (
            state,
            action: PayloadAction<{ index: number; updatedBulkData: SoftwareProductBulk }>
        ) => {
            const { index, updatedBulkData } = action.payload;
            if (index >= 0 && index < state.softwarePlanBulk.length) {
                state.softwarePlanBulk[index] = {
                    ...state.softwarePlanBulk[index],
                    ...updatedBulkData,
                };
            }
        },
        resetData: state => initialStateData,
    },
});

export const {
    setBulkSoftwareProductsData,
    setBulkSoftwarePlansData,
    resetData,
    updateSoftwareProductBulkJson,
    updateSoftwarePlansBulkJson,
} = bulkProductsSlice.actions;

export default bulkProductsSlice.reducer;
