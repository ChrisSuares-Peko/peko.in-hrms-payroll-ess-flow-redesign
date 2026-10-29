import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Checkout from '../../components/Checkout';
import useCheckout from '../../hooks/useCheckout';
// import { updateQuantity } from '../../slices/hikeSlice';

vi.mock('../../hooks/useCheckout', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handleSubmission: vi.fn(),
    })),
}));

vi.mock('../../slices/hikeSlice', () => ({
    updateQuantity: vi.fn(),
}));

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: (num: number) => num.toString(),
}));

const mockStore = configureStore([]);

describe('Checkout Component', () => {
    let store: any;

    const mockHikeArray = [
        {
            id: 1,
            logo: 'logo1.png',
            price: 100,
            quantity: 2,
            totalPrice: 200,
            employees: [],
        },
        {
            id: 2,
            logo: 'logo2.png',
            price: 150,
            quantity: 1,
            totalPrice: 150,
            employees: [],
        },
    ];

    beforeEach(() => {
        store = mockStore({
            reducer: {
                hike: {
                    amount: 350,
                    hikeArray: mockHikeArray,
                },
            },
        });
    });

    it('should render the component and display default UI elements', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByText('Reward your employees')).toBeInTheDocument();
        const subtotal = screen.getAllByText('Sub Total');
        expect(subtotal[0]).toBeInTheDocument();
        expect(screen.getByText('Taxes and fees')).toBeInTheDocument();

        const totalAmountElements = screen.getAllByText('₹ 150');
        expect(totalAmountElements.length).toBeGreaterThanOrEqual(1);
        expect(totalAmountElements[0]).toBeInTheDocument();
    });

    // it('should handle quantity change and update total amount', () => {
    //   render(
    //     <Provider store={store}>
    //       <BrowserRouter> {/* Wrap component in BrowserRouter */}
    //         <Checkout />
    //       </BrowserRouter>
    //     </Provider>
    //   );

    //   const inputNumbers = screen.getAllByRole('spinbutton');

    //   fireEvent.change(inputNumbers[0], { target: { value: '3' } });

    //   expect(updateQuantity).toHaveBeenCalledWith({
    //     id: 1,
    //     quantity: 3,
    //   });
    // });

    it('should display the correct total amount in the summary', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );

        const totalElements = screen.getByText('Total Amount');
        expect(totalElements).toBeInTheDocument();
    });

    it('should call handleSubmission when clicking the Continue button', () => {
        const mockHandleSubmission = vi.fn();
        (useCheckout as any).mockReturnValue({ handleSubmission: mockHandleSubmission });

        render(
            <Provider store={store}>
                <BrowserRouter>
                    {' '}
                    {/* Wrap component in BrowserRouter */}
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );

        const continueButton = screen.getByText('Continue');
        fireEvent.click(continueButton);

        expect(mockHandleSubmission).toHaveBeenCalled();
    });

    it('should display the correct quantity in the input fields', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    {' '}
                    {/* Wrap component in BrowserRouter */}
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );

        expect(screen.getByDisplayValue('2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should not allow the user to manually type in the quantity', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    {' '}
                    {/* Wrap component in BrowserRouter */}
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );

        const quantityInput = screen.getByDisplayValue('2');

        // Ensure the input has the 'readonly' attribute
        expect(quantityInput).toHaveAttribute('readonly');

        // Attempt to change value and confirm it doesn’t update
        fireEvent.change(quantityInput, { target: { value: '5' } });
        expect(quantityInput).toHaveValue('2');
    });

    it('should calculate the correct total and subtotal', () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    {' '}
                    {/* Wrap component in BrowserRouter */}
                    <Checkout />
                </BrowserRouter>
            </Provider>
        );
        screen.debug(undefined, 200000);
        const subtotal = mockHikeArray.reduce((acc, item) => acc + item.totalPrice, 0);
        const totalElements = screen.getAllByText(subtotal.toString());
        expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });
});
