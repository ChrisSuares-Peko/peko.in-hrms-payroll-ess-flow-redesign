import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    HistoryFormValues,
    InspectionFormValues,
    InspectionPackage,
    ReportType,
    SelectedVehicle,
    ValuationFormValues,
    VehicleCategory,
} from '../types/index';

interface Drafts {
    valuation?: Partial<ValuationFormValues>;
    history?: Partial<HistoryFormValues>;
    inspection?: Partial<InspectionFormValues>;
}

interface VehicleReportState {
    reportType: ReportType | null;
    selectedVehicle: SelectedVehicle | null;
    inspectionPackage: InspectionPackage | null;
    // Car / Bike / Scooter, chosen on the inspection service-select step. Shown as a
    // meta chip on the booking form and sent with the order.
    inspectionCategory: VehicleCategory;
    // Form values are kept so returning from the shared /payments screen (which
    // navigates back rather than popping history) restores what the user typed.
    drafts: Drafts;
}

const initialState: VehicleReportState = {
    reportType: null,
    selectedVehicle: null,
    inspectionPackage: null,
    inspectionCategory: 'car',
    drafts: {},
};

export const vehicleReportSlice = createSlice({
    name: 'vehicleReportSlice',
    initialState,
    reducers: {
        setReportType: (state, action: PayloadAction<ReportType>) => {
            state.reportType = action.payload;
        },
        setSelectedVehicle: (state, action: PayloadAction<SelectedVehicle>) => {
            state.selectedVehicle = action.payload;
        },
        clearSelectedVehicle: state => {
            state.selectedVehicle = null;
        },
        setInspectionPackage: (state, action: PayloadAction<InspectionPackage>) => {
            state.inspectionPackage = action.payload;
        },
        setInspectionCategory: (state, action: PayloadAction<VehicleCategory>) => {
            state.inspectionCategory = action.payload;
        },
        saveDraft: (
            state,
            action: PayloadAction<{ reportType: ReportType; values: Drafts[keyof Drafts] }>
        ) => {
            state.drafts = {
                ...state.drafts,
                [action.payload.reportType]: action.payload.values,
            };
        },
        clearVehicleReport: () => initialState,
    },
});

export const {
    setReportType,
    setSelectedVehicle,
    clearSelectedVehicle,
    setInspectionPackage,
    setInspectionCategory,
    saveDraft,
    clearVehicleReport,
} = vehicleReportSlice.actions;

export default vehicleReportSlice.reducer;
