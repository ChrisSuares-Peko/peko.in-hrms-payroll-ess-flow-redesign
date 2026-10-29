import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { completeAnyPGPayment } from '../../api';
import PaymentPending from '../../pages/PaymentPending';

const navigate = vi.fn();

vi.mock('pusher-js', () => ({
    default: class {
        subscribe = vi.fn(() => ({ bind: vi.fn(), unbind: vi.fn() }));

        unsubscribe = vi.fn();

        disconnect = vi.fn();
    },
}));
vi.mock('react-svg', () => ({ ReactSVG: () => null }));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({ reducer: { auth: { id: 7, role: 'corporate' } } }),
}));
vi.mock('../../api', () => ({ completeAnyPGPayment: vi.fn() }));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigate,
        useLocation: () => ({ state: { corporateTxnId: 'TXN1' } }),
        Link: ({ children }: { children: React.ReactNode }) => children,
    };
});

const advance = (ms: number) =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });

describe('PaymentPending polling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('checks again while the payment is pending and stops after three checks', async () => {
        (completeAnyPGPayment as Mock).mockResolvedValue({ pending: true });
        render(<PaymentPending />);

        await advance(0);
        expect(completeAnyPGPayment).toHaveBeenCalledTimes(1);
        expect(completeAnyPGPayment).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            ORDERID: 'TXN1',
        });

        await advance(20000);
        expect(completeAnyPGPayment).toHaveBeenCalledTimes(2);

        await advance(40000);
        expect(completeAnyPGPayment).toHaveBeenCalledTimes(3);

        await advance(120000);
        expect(completeAnyPGPayment).toHaveBeenCalledTimes(3);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('checks again when the check itself fails', async () => {
        (completeAnyPGPayment as Mock).mockResolvedValueOnce(false).mockResolvedValueOnce({
            corporateTxnId: 'TXN1',
        });
        render(<PaymentPending />);

        await advance(0);
        await advance(20000);

        expect(completeAnyPGPayment).toHaveBeenCalledTimes(2);
        expect(navigate).toHaveBeenCalledWith(
            '/payments/payment-success?status=success&transactionId=TXN1'
        );
    });

    it('stops checking once the payment succeeds', async () => {
        (completeAnyPGPayment as Mock).mockResolvedValue({ corporateTxnId: 'TXN1' });
        render(<PaymentPending />);

        await advance(0);
        await advance(60000);

        expect(completeAnyPGPayment).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith(
            '/payments/payment-success?status=success&transactionId=TXN1'
        );
    });

    it('stops checking and shows the failure once the payment fails', async () => {
        (completeAnyPGPayment as Mock).mockResolvedValue({
            failed: true,
            responseCode: '001',
            failureMessage: 'Payment declined',
        });
        render(<PaymentPending />);

        await advance(0);
        await advance(60000);

        expect(completeAnyPGPayment).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith('/payments/payment-failure', {
            state: { responseCode: '001', errorMessage: 'Payment declined' },
        });
    });
});
