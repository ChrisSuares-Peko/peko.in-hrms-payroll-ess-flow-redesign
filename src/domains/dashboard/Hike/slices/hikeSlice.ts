import { PayloadAction, createSlice } from '@reduxjs/toolkit';

interface InitialState {
    hikeArray: any[];
    amount: number;
}
const initialState: InitialState = {
    hikeArray: [],
    amount: 0,
};

export const hikeSlice = createSlice({
    name: 'hike',
    initialState,
    reducers: {
        setHikeArray: (state, action: PayloadAction<any>) => {
            state.hikeArray = action.payload;
        },
        setAmount: (state, action: PayloadAction<number>) => {
            state.amount = action.payload;
        },

        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload;
            const hike = state.hikeArray.find(h => h.id === id);
            if (hike) {
                hike.quantity = quantity; // Update the quantity of the selected hike
                hike.totalPrice = hike.price * quantity; // Adjust total price if needed
            }
        },
        resetHike: state => {
            state.hikeArray = initialState.hikeArray;
            return state;
        },
        resetAmount: state => {
            state.amount = initialState.amount;
            return state;
        },
    },
});

export const { setHikeArray, setAmount, updateQuantity, resetHike, resetAmount } =
    hikeSlice.actions;
export default hikeSlice.reducer;
