import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OrderPlaced from '../../pages/OrderPlaced';

const mockNavigate = vi.fn();

vi.mock(import('react-router-dom'), async importOriginal => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

// the success animation is irrelevant here and pulls in a canvas-y player
vi.mock('react-lottie', () => ({ default: () => null }));

// the page reads the payment instrument off the order; the fetch isn't what these tests cover
vi.mock('@domains/dashboard/payments/hooks/useGetTransactionData', () => ({
    default: () => ({ transactionData: undefined, isLoading: false }),
}));

const mockStore = configureStore([]);

const confirmedGroup = {
    bppId: 'bpp.example.com',
    bppUri: 'https://bpp.example.com',
    providerId: 'P1',
    vendorName: 'Acme Stationery',
    cartItems: [],
    transactionId: 'txn-1',
    status: 'confirmed',
    orderId: 'O-1',
    orderState: 'Created',
    quote: null,
};

const buildStore = (settlement?: any) =>
    mockStore({
        reducer: {
            cart: {
                confirmation: {
                    groups: [confirmedGroup],
                    confirmedTotal: 1000,
                    amountPaidTotal: 1011.8,
                    allConfirmed: true,
                    anyConfirmed: true,
                    failedCount: 0,
                    paymentRef: '1758000000000',
                    confirmedAt: '2026-07-31T10:00:00.000Z',
                    ...(settlement !== undefined && { settlement }),
                },
            },
            payment: { totalAmount: 1011.8 },
        },
    });

const renderPage = (store: any) =>
    render(
        <Provider store={store}>
            <MemoryRouter>
                <OrderPlaced />
            </MemoryRouter>
        </Provider>
    );

describe('OrderPlaced — success is gated on seller settlement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('refuses to render success when the settlement failed, even on a direct visit', async () => {
        renderPage(buildStore({ status: 'FAILED', splitCount: 0, splitTotal: 0, skipped: [] }));

        expect(screen.queryByText('Your order has been placed')).not.toBeInTheDocument();
        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/office-supplies', { replace: true })
        );
    });

    it('shows success and reports the payout as settled', () => {
        renderPage(buildStore({ status: 'SPLIT', splitCount: 1, splitTotal: 1000, skipped: [] }));

        expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
        expect(screen.getByText('Seller Settlement')).toBeInTheDocument();
        expect(screen.getByText('Settled')).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows success and flags a partial payout', () => {
        renderPage(
            buildStore({ status: 'PARTIAL', splitCount: 1, splitTotal: 1000, skipped: [{}] })
        );

        expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
        expect(screen.getByText('Partially settled')).toBeInTheDocument();
    });

    it('shows success with "Not applicable" when there was nothing to settle', () => {
        renderPage(buildStore({ status: 'SKIPPED', splitCount: 0, splitTotal: 0, skipped: [] }));

        expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
        expect(screen.getByText('Not applicable')).toBeInTheDocument();
    });

    // Fail open for a backend that predates the settlement field.
    it('shows success and omits the settlement row when settlement is absent', () => {
        renderPage(buildStore());

        expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
        expect(screen.queryByText('Seller Settlement')).not.toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('still bounces when nothing was confirmed at all', async () => {
        const store = mockStore({
            reducer: {
                cart: { confirmation: { groups: [], anyConfirmed: false, failedCount: 1 } },
                payment: { totalAmount: 0 },
            },
        });
        renderPage(store);

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/office-supplies', { replace: true })
        );
    });
});

describe('OrderPlaced — sellers that could not be placed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const partialStore = (refund: any) =>
        mockStore({
            reducer: {
                cart: {
                    confirmation: {
                        groups: [
                            confirmedGroup,
                            {
                                ...confirmedGroup,
                                transactionId: 'txn-2',
                                vendorName: 'Other Seller',
                                status: 'failed',
                                orderId: null,
                            },
                        ],
                        confirmedTotal: 1000,
                        amountPaidTotal: 1011.8,
                        allConfirmed: false,
                        anyConfirmed: true,
                        failedCount: 1,
                        paymentRef: '1758000000000',
                        confirmedAt: '2026-07-31T10:00:00.000Z',
                        refund,
                    },
                },
                payment: { totalAmount: 1261.8 },
            },
        });

    it('shows the refund of the failed seller in the details and the note', () => {
        renderPage(partialStore({ status: 'INITIATED', amount: 250 }));

        expect(screen.getByText('Your order has been placed')).toBeInTheDocument();
        expect(screen.getByText('Refund')).toBeInTheDocument();
        expect(screen.getByText(/250\.00 · Refund initiated/)).toBeInTheDocument();
        expect(
            screen.getByText(/Other Seller\s+could not be placed.*250\.00 is being refunded/)
        ).toBeInTheDocument();
    });

    it('reports a refund the team has to process instead of claiming it is on its way', () => {
        renderPage(partialStore({ status: 'FAILED', amount: 250 }));

        expect(screen.getByText(/250\.00 · Being processed by our team/)).toBeInTheDocument();
        expect(screen.queryByText(/is being refunded/)).not.toBeInTheDocument();
    });

    it('omits the refund row when nothing is owed back', () => {
        renderPage(buildStore());

        expect(screen.queryByText('Refund')).not.toBeInTheDocument();
    });
});
