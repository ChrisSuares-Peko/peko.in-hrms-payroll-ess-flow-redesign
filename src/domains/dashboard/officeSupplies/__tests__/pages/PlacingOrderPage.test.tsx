import { render, screen, waitFor } from '@testing-library/react';
import { notification } from 'antd';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getCheckoutResultApi } from '../../api/cart';
import PlacingOrderPage from '../../pages/PlacingOrderPage';

// spy on the partial-settlement warning without silencing the rest of antd
vi.mock(import('antd'), async importOriginal => {
    const actual = await importOriginal();
    return { ...actual, notification: { ...actual.notification, warning: vi.fn() } };
});

const mockNavigate = vi.fn();

vi.mock(import('react-router-dom'), async importOriginal => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../api/cart', () => ({
    getCheckoutResultApi: vi.fn(),
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
    reason: null,
    quote: null,
    deliveryTat: null,
    expectedDeliveryDate: null,
    orderId: 'O-1',
    payment: {},
    error: null,
};

const buildStore = () =>
    mockStore({
        reducer: {
            auth: { id: 7, role: 'corporate' },
            cart: {},
            payment: { totalAmount: 1011.8 },
        },
    });

const PAID_URL = '/office-supplies/placing-order?status=success&transactionId=1758000000000';

const renderPage = (store: any, url = PAID_URL) =>
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={[url]}>
                <PlacingOrderPage />
            </MemoryRouter>
        </Provider>
    );

describe('PlacingOrderPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('polls checkout-result with the gateway reference from the query string', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'CONFIRMED',
            groups: [confirmedGroup],
            confirmedTotal: 1000,
            amountPaidTotal: 1011.8,
            allConfirmed: true,
            anyConfirmed: true,
            failedCount: 0,
        });

        const store = buildStore();
        renderPage(store);

        await waitFor(() => expect(getCheckoutResultApi).toHaveBeenCalled());
        expect(getCheckoutResultApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            paymentRef: '1758000000000',
        });

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/office-supplies/order-placed', {
                replace: true,
            })
        );
        const confirmed = store
            .getActions()
            .find((action: any) => action.type === 'cart/setConfirmation');
        expect(confirmed.payload.paymentRef).toBe('1758000000000');
    });

    it('polls checkout-result only once per mount even if called twice in one tick path', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'CONFIRMED',
            groups: [confirmedGroup],
            confirmedTotal: 1000,
            allConfirmed: true,
            anyConfirmed: true,
            failedCount: 0,
        });

        renderPage(buildStore());
        await waitFor(() => expect(getCheckoutResultApi).toHaveBeenCalled());
        // Single mount must not open two poll loops.
        expect(getCheckoutResultApi).toHaveBeenCalledTimes(1);
    });

    it('redirects to the cart when there is no gateway reference', async () => {
        renderPage(buildStore(), '/office-supplies/placing-order');

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/office-supplies/cart', { replace: true })
        );
        expect(getCheckoutResultApi).not.toHaveBeenCalled();
    });

    it('shows the refund error state instead of navigating when no seller confirms', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'FAILED',
            groups: [{ ...confirmedGroup, status: 'failed', reason: 'session_expired' }],
            confirmedTotal: 0,
            allConfirmed: false,
            anyConfirmed: false,
            failedCount: 1,
            refund: { status: 'INITIATED', amount: 1011.8 },
        });

        renderPage(buildStore());

        expect(await screen.findByText("We couldn't place your order")).toBeInTheDocument();
        expect(screen.getByText(/1,011\.80 is being refunded/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalledWith('/office-supplies/order-placed', {
            replace: true,
        });
    });

    // The refund copy is whatever the backend reports — never a blanket promise.
    it('says so when the refund could not be started automatically', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'FAILED',
            groups: [{ ...confirmedGroup, status: 'failed', reason: 'timeout' }],
            confirmedTotal: 0,
            allConfirmed: false,
            anyConfirmed: false,
            failedCount: 1,
            refund: { status: 'FAILED', amount: 1011.8 },
        });

        renderPage(buildStore());

        expect(await screen.findByText(/our team has been notified/i)).toBeInTheDocument();
        expect(screen.queryByText(/is being refunded/i)).not.toBeInTheDocument();
    });

    it('does not promise an automatic refund when the backend reports none', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'FAILED',
            groups: [],
            confirmedTotal: 0,
            allConfirmed: false,
            anyConfirmed: false,
            failedCount: 0,
        });

        renderPage(buildStore());

        expect(await screen.findByText(/contact support with the payment reference/i)).toBeInTheDocument();
    });

    it('shows each seller\'s progress while the checkout is still in progress', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'PENDING',
            groups: [
                confirmedGroup,
                { ...confirmedGroup, transactionId: 'txn-2', vendorName: 'Other Seller', status: 'pending' },
            ],
            anyConfirmed: true,
            allConfirmed: false,
            failedCount: 0,
            deadlineAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });

        renderPage(buildStore());

        expect(await screen.findByText('Other Seller')).toBeInTheDocument();
        expect(screen.getByText('Acme Stationery')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Waiting for seller…')).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalledWith('/office-supplies/order-placed', {
            replace: true,
        });
    });

    it('warns about the seller that could not be placed, with the refund, on a partial order', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'CONFIRMED',
            groups: [
                confirmedGroup,
                {
                    ...confirmedGroup,
                    transactionId: 'txn-2',
                    vendorName: 'Other Seller',
                    status: 'failed',
                    reason: 'timeout',
                },
            ],
            confirmedTotal: 1000,
            amountPaidTotal: 1011.8,
            allConfirmed: false,
            anyConfirmed: true,
            failedCount: 1,
            refund: { status: 'INITIATED', amount: 250 },
        });

        const store = buildStore();
        renderPage(store);

        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith('/office-supplies/order-placed', {
                replace: true,
            })
        );
        expect(notification.warning).toHaveBeenCalledWith(
            expect.objectContaining({
                description: expect.stringMatching(
                    /Other Seller could not be placed.*250\.00 is being refunded/
                ),
            })
        );
        const confirmed = store
            .getActions()
            .find((action: any) => action.type === 'cart/setConfirmation');
        expect(confirmed.payload.refund).toEqual({ status: 'INITIATED', amount: 250 });
    });

    it('keeps waiting when checkout-result is still PENDING', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue({
            status: 'PENDING',
            groups: [],
            anyConfirmed: false,
            failedCount: 0,
        });

        renderPage(buildStore());

        await waitFor(() => expect(getCheckoutResultApi).toHaveBeenCalled());
        expect(screen.getByText(/Placing your order/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalledWith('/office-supplies/order-placed', {
            replace: true,
        });
    });
});

/**
 * Order placement is independent of Easy Split. Settlement warnings are okay;
 * FAILED settlement must not block navigating to order-placed.
 */
describe('PlacingOrderPage — settlement does not block success', () => {
    const confirmed = (settlement?: any) => ({
        status: 'CONFIRMED',
        groups: [confirmedGroup],
        confirmedTotal: 1000,
        amountPaidTotal: 1011.8,
        allConfirmed: true,
        anyConfirmed: true,
        failedCount: 0,
        ...(settlement !== undefined && { settlement }),
    });

    const ORDER_PLACED = ['/office-supplies/order-placed', { replace: true }] as const;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('still shows success when seller settlement failed (order is placed)', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue(
            confirmed({
                status: 'FAILED',
                reason: 'split_rejected',
                message: 'split amount exceeds order amount',
                splitCount: 1,
                splitTotal: 1000,
                skipped: [],
            })
        );

        const store = buildStore();
        renderPage(store);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(...ORDER_PLACED));
        expect(
            store.getActions().find((a: any) => a.type === 'cart/setConfirmation')
        ).toBeTruthy();
        expect(notification.warning).toHaveBeenCalled();
    });

    it.each(['SPLIT', 'SKIPPED', 'DISABLED'])(
        'shows success when settlement is %s',
        async status => {
            (getCheckoutResultApi as Mock).mockResolvedValue(
                confirmed({ status, splitCount: 1, splitTotal: 1000, skipped: [] })
            );

            renderPage(buildStore());

            await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(...ORDER_PLACED));
        }
    );

    it('shows success but warns when settlement is PARTIAL', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue(
            confirmed({
                status: 'PARTIAL',
                splitCount: 1,
                splitTotal: 1000,
                skipped: [
                    {
                        seller: 'Other Seller',
                        providerId: 'P2',
                        amount: 250,
                        reason: 'masked_settlement_details',
                    },
                ],
            })
        );

        renderPage(buildStore());

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(...ORDER_PLACED));
        expect(notification.warning).toHaveBeenCalledWith(
            expect.objectContaining({
                description: expect.stringContaining('Other Seller'),
            })
        );
    });

    it('shows success when the response carries no settlement at all', async () => {
        (getCheckoutResultApi as Mock).mockResolvedValue(confirmed());

        renderPage(buildStore());

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(...ORDER_PLACED));
    });
});
