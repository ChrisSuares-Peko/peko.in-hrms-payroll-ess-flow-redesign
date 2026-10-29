import { PayloadAction, createSlice } from '@reduxjs/toolkit';

const initialState = {
    name: '',
    email: '',
    basicSalary: 0,
    dateOfJoin: '',
};

const payrollSalarySlice = createSlice({
    name: 'payrollSalary',
    initialState,
    reducers: {
        setEmployeeName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setEmployeeEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setBasicSalary: (state, action: PayloadAction<number>) => {
            state.basicSalary = action.payload;
        },
        setDateOfJoin: (state, action: PayloadAction<string>) => {
            state.dateOfJoin = action.payload;
        },

        resetSalarySlice: state => {
            state = initialState;
            return state;
        },
    },
});

export const {
    setEmployeeName,
    setEmployeeEmail,
    setBasicSalary,
    setDateOfJoin,
    resetSalarySlice,
} = payrollSalarySlice.actions;
export default payrollSalarySlice.reducer;
