// import { PayloadAction, createSlice } from '@reduxjs/toolkit';

// import { OrderDetailsSlice } from '../type/orderHistory';

// const initialState: OrderDetailsSlice = {
//     planDetails: {
//         name: null,
//         description: null,
//         price: null,
//         billingCycle: null,
//         features: null,
//     },
//     name: null,
//     email: null,
//     mobile: null,
//     status: null,
//     refresh: null,
// };

// export const orderDetailsSlice = createSlice({
//     name: 'orderDetails',
//     initialState,
//     reducers: {
//         setOrderDetails: (state, action: PayloadAction<Partial<OrderDetailsSlice>>) => {
//             state = { ...state, ...action.payload };
//             return state;
//         },
//     },
// });

// export const { setOrderDetails } = orderDetailsSlice.actions;

// export default orderDetailsSlice.reducer;
