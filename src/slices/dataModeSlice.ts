// PROTOTYPE-SETUP: which demo dataset the prototype renders. 'dummy' = populated demo data,
// 'empty' = empty states. Persisted (store.ts whitelist). Infrastructure only; datasets are a separate task.
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type DataMode = 'dummy' | 'empty';

interface DataModeState {
    mode: DataMode;
}

const initialState: DataModeState = {
    mode: 'dummy',
};

export const dataModeSlice = createSlice({
    name: 'dataMode',
    initialState,
    reducers: {
        setDataMode: (state, action: PayloadAction<DataMode>) => {
            state.mode = action.payload;
        },
    },
});

export const { setDataMode } = dataModeSlice.actions;

export default dataModeSlice.reducer;
