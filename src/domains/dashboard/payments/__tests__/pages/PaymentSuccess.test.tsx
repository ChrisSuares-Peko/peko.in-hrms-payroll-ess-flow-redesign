import React from 'react';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, beforeEach, it, expect, vi, Mock } from 'vitest';

import { paths } from '@src/routes/paths';

import { clearData } from '../../../emailDomain/slices/businessEmailSlice';
import useGetTransactionData from '../../hooks/useGetTransactionData';
import PaymentSuccess from '../../pages/PaymentSuccess';
import { resetPaymentData } from '../../slices/payment';

vi.mock('../../hooks/useBulkPaymentStatusUpdate', () => ({
    default: vi.fn(() => ({
        updateStatus: vi.fn(), // Mo
        isUpdating: false,
        error: null,
    })),
}));

vi.mock('../../hooks/useGetTransactionData', () => ({
    default: vi.fn(() => ({
        transactionData: {
            transactionDate: '2024-02-01',
            corporateTxnId: 'TXN123456',
            serviceOperator: { serviceProvider: 'Test Operator', accessKey: 'mockAccessKey' },
            amountInINR: '1000',
            paymentMode: 'Credit Card',
        },
        isLoading: false,
    })),
}));
// vi.mock("lottie-react", () => ({
//   default: vi.fn(() => <div data-testid="lottie-animation"></div>),
// }));

const mockStore = configureStore([]);
const mockNavigate = vi.fn();

vi.mock(import('react-router-dom'), async importOriginal => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('PaymentSuccess Component', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { id: '123', role: 'admin' },
            },
        });
        store.dispatch = vi.fn();
    });

    it('renders success page correctly', async () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {
                transactionDate: '2025-01-01',
                corporateTxnId: 'TXN123',
                serviceOperator: { serviceProvider: 'Operator A' },
                amountInINR: 500,
                paymentMode: 'UPI',
            },
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter
                    initialEntries={['/payment-success?status=success&transactionId=123']}
                >
                    <Routes>
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        expect(await screen.findByText(/Transaction ID/i)).toBeInTheDocument();
        expect(await screen.findByText(/TXN123/i)).toBeInTheDocument();
    });

    it('redirects to dashboard if status is not success', () => {
        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/payment-success?status=failed']}>
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );

        expect(mockNavigate).toHaveBeenCalledWith(paths.dashboard.home);
    });

    it('shows loading skeleton when isLoading is true', () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {},
            isLoading: true,
        });

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/payment-success?status=success']}>
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );
        expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
    });

    it('calls resetPaymentData and clearData on mount', () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {},
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/payment-success?status=success']}>
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );

        expect(store.dispatch).toHaveBeenCalledWith(resetPaymentData());
        expect(store.dispatch).toHaveBeenCalledWith(clearData());
    });

    it('parses bulkPaymentDataString correctly', async () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {},
            isLoading: false,
        });

        const bulkPaymentData = encodeURIComponent(
            JSON.stringify([{ 'Transaction ID': 'BATCH123' }])
        );

        render(
            <Provider store={store}>
                <MemoryRouter
                    initialEntries={[
                        `/payment-success?status=success&bulkPaymentData=${bulkPaymentData}`,
                    ]}
                >
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );
        await waitFor(() => {
            expect(screen.getByText(/Transaction ID/i)).toBeInTheDocument();
        });
    });

    it('displays payment transaction table when data is available', async () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {
                transactionDate: '2025-01-01',
                corporateTxnId: 'TXN123',
                serviceOperator: { serviceProvider: 'Operator A' },
                amountInINR: 500,
                paymentMode: 'UPI',
            },
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/payment-success?status=success']}>
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );

        expect(await screen.findByText(/Operator A/i)).toBeInTheDocument();
    });

    it('displays bulk payment table when bulk payments exist', async () => {
        const bulkPaymentData = encodeURIComponent(
            JSON.stringify([{ corporateTxnId: 'batch123', amount: 1000 }])
        );

        render(
            <Provider store={store}>
                <MemoryRouter
                    initialEntries={[
                        `/payment-success?status=success&bulkPaymentData=${bulkPaymentData}`,
                    ]}
                >
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );

        // Use `findByText` to wait for the table content
        await waitFor(() => {
            // Look for the transaction ID (corporateTxnId, which is batch123 in this case)
            expect(screen.getByText(/batch123/i, { selector: 'td' })).toBeInTheDocument();
        });
    });

    it('handles navigation buttons correctly', async () => {
        (useGetTransactionData as Mock).mockReturnValue({
            transactionData: {},
            isLoading: false,
        });

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/payment-success?status=success']}>
                    <PaymentSuccess />
                </MemoryRouter>
            </Provider>
        );

        const dashboardBtn = screen.getByText(/go to dashboard/i);
        const transactionBtn = screen.getByText(/view transaction/i);

        fireEvent.click(dashboardBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');

        fireEvent.click(transactionBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
});
