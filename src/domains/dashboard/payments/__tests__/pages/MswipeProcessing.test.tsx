import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { completeMswipePayment } from '../../api';
import MswipeProcessing from '../../pages/MswipeProcessing';

const routing = vi.hoisted(() => ({
    navigate: vi.fn(),
    search: 'orderId=1729000000000',
}));
const paymentState = vi.hoisted(() => ({
    current: { payload: { accessKey: 'tbo_airline' }, url: '', successPath: '' } as Record<
        string,
        unknown
    >,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => routing.navigate,
    useSearchParams: () => [new URLSearchParams(routing.search)],
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({
            reducer: {
                auth: { id: 7, role: 'corporate' },
                user: { user: { balance: 0 } },
                payment: paymentState.current,
            },
        }),
}));

vi.mock('@src/slices/userSlice', () => ({ setUserInfo: vi.fn() }));
vi.mock('../../../CorporateTravel/store/visaSlice', () => ({ setVisaOrderNumber: vi.fn() }));
vi.mock('../../api', () => ({ completeMswipePayment: vi.fn() }));

describe('MswipeProcessing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        routing.search = 'orderId=1729000000000';
        paymentState.current = { payload: { accessKey: 'tbo_airline' }, url: '', successPath: '' };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('completes the order and opens the payments success page', async () => {
        (completeMswipePayment as Mock).mockResolvedValueOnce({ corporateTxnId: '1729000000000' });

        render(<MswipeProcessing />);

        await waitFor(() =>
            expect(routing.navigate).toHaveBeenCalledWith(
                '/payments/payment-success?status=success&transactionId=1729000000000'
            )
        );
        expect(completeMswipePayment).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            ORDERID: '1729000000000',
        });
    });

    it('shows the failure page with the reason when the payment failed', async () => {
        (completeMswipePayment as Mock).mockResolvedValueOnce({
            failed: true,
            responseCode: '001',
            failureMessage: 'Payment failed',
        });

        render(<MswipeProcessing />);

        await waitFor(() =>
            expect(routing.navigate).toHaveBeenCalledWith('/payments/payment-failure', {
                state: { responseCode: '001', errorMessage: 'Payment failed' },
            })
        );
    });

    it('shows the failure page when the completion call errors', async () => {
        (completeMswipePayment as Mock).mockResolvedValueOnce(false);

        render(<MswipeProcessing />);

        await waitFor(() =>
            expect(routing.navigate).toHaveBeenCalledWith('/payments/payment-failure')
        );
    });

    it('goes straight to the failure page without an order id', async () => {
        routing.search = '';

        render(<MswipeProcessing />);

        await waitFor(() =>
            expect(routing.navigate).toHaveBeenCalledWith('/payments/payment-failure')
        );
        expect(completeMswipePayment).not.toHaveBeenCalled();
    });

    it('waits for a pending payment to settle before showing success', async () => {
        vi.useFakeTimers();
        (completeMswipePayment as Mock)
            .mockResolvedValueOnce({ pending: true })
            .mockResolvedValueOnce({ corporateTxnId: '1729000000000' });

        render(<MswipeProcessing />);
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(completeMswipePayment).toHaveBeenCalledTimes(2);
        expect(routing.navigate).toHaveBeenCalledWith(
            '/payments/payment-success?status=success&transactionId=1729000000000'
        );
    });

    it('shows the pending page when Mswipe has not settled the payment', async () => {
        vi.useFakeTimers();
        (completeMswipePayment as Mock).mockResolvedValue({
            pending: true,
            corporateTxnId: '1729000000000',
            details: { message: 'Payment is processing' },
        });

        render(<MswipeProcessing />);
        await act(async () => {
            await vi.runAllTimersAsync();
        });

        expect(completeMswipePayment).toHaveBeenCalledTimes(5);
        expect(routing.navigate).toHaveBeenCalledWith('/payments/payment-pending', {
            state: expect.objectContaining({
                corporateTxnId: '1729000000000',
                accessKey: 'tbo_airline',
                firstBtnText: 'Go to Manage Bookings',
            }),
        });
    });
});
