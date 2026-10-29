import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import Summary from '../../components/Summary';
import { setPaymentData } from '../../slices/payment';

vi.mock('../../hooks/useSurchargeApi', () => ({
    useSurchageApi: () => ({
        getEarningCashback: vi.fn().mockResolvedValue(50), // Mocked cashback value
    }),
}));

const mockStore = configureStore([]);

describe('Summary Component', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                payment: {
                    paymentSummary: [{ key: 'Convenience Fee', value: 10 }],
                    minimumAmount: 10,
                    maximumAmount: 5000,
                    totalAmount: 1000,
                    payload: {
                        bulkPaymentData: [{ amount: 1000 }],
                        accessKey: 'test-key',
                    },
                    billSummary: [{ key: 'Amount', value: 1000 }],
                    earningCashbackAmount: 0,
                },
            },
        });
        store.dispatch = vi.fn();
    });

    it('renders correctly with text value', () => {
        render(
            <Provider store={store}>
                <Summary headName="Total Amount" value="₹ 1000" />
            </Provider>
        );

        expect(screen.getByText(/Total Amount/i)).toBeInTheDocument();
        expect(screen.getByText(/₹ 1000/i)).toBeInTheDocument();
    });

    it('renders input field when isInput is true', () => {
        render(
            <Provider store={store}>
                <Summary headName="Amount" value={1000} isInput />
            </Provider>
        );

        expect(screen.getByPlaceholderText(/Please Enter the amount/i)).toBeInTheDocument();
    });

    it('clicking the edit icon enables the input field', () => {
        render(
            <Provider store={store}>
                <Summary headName="Amount" value={1000} isInput />
            </Provider>
        );

        const editIcon = screen.getByRole('img', { hidden: true }); // Ant Design icons are images
        fireEvent.click(editIcon);

        const input = screen.getByPlaceholderText(/Please Enter the amount/i);
        expect(input).not.toBeDisabled();
    });

    it('changing the amount updates state correctly', () => {
        render(
            <Provider store={store}>
                <Summary headName="Amount" value={1000} isInput />
            </Provider>
        );

        const input = screen.getByPlaceholderText(/Please Enter the amount/i);
        fireEvent.change(input, { target: { value: '2000' } });

        expect(input).toHaveValue('2000');
    });

    it('validates the amount on blur and updates state', async () => {
        render(
            <Provider store={store}>
                <Summary headName="Amount" value={1000} isInput />
            </Provider>
        );

        const input = screen.getByPlaceholderText(/Please Enter the amount/i);
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith({
                payload: {
                    billSummary: [
                        {
                            key: 'Amount',
                            value: 1000,
                        },
                    ],
                    earningCashbackAmount: 50,
                    maximumAmount: 5000,
                    minimumAmount: 10,
                    payload: {
                        accessKey: 'test-key',
                        bulkPaymentData: [
                            {
                                amount: 1000,
                            },
                        ],
                    },
                    paymentSummary: [
                        {
                            key: 'Convenience Fee',
                            value: 10,
                        },
                    ],
                    totalAmount: 1000,
                },
                type: 'payment/setPaymentData',
            });
        });
    });

    it('calls getEarningCashback on blur and updates cashback amount', async () => {
        render(
            <Provider store={store}>
                <Summary headName="Amount" value={1000} isInput />
            </Provider>
        );

        const input = screen.getByPlaceholderText(/Please Enter the amount/i);
        fireEvent.change(input, { target: { value: '3000' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(store.dispatch).toHaveBeenCalledWith(
                setPaymentData(
                    expect.objectContaining({
                        earningCashbackAmount: 50, // Mocked cashback response
                    })
                )
            );
        });
    });
});
