import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PaymentSummaryCard from '../../components/PaymentSummaryCard';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({
            reducer: {
                payment: {
                    billSummary: [],
                    paymentSummary: [],
                    navigatePath: '/mobile-recharge-&-bills/postpaid',
                },
                auth: {},
            },
        }),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: () => ({ xs: false }),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => navigateMock };
});

const platformFee = [{ key: 'Platform fee (inclusive of GST)', value: '₹ 0.00' }];

describe('PaymentSummaryCard when no payment is due', () => {
    const onPay = vi.fn();

    beforeEach(() => {
        onPay.mockClear();
        navigateMock.mockClear();
        render(
            <PaymentSummaryCard
                paymentSummary={platformFee}
                totalAmount={0}
                payLabel="No Payment Due"
                isPayDisabled
                isLoading={false}
                onPay={onPay}
            />
        );
    });

    it('shows an amount payable of zero', () => {
        expect(screen.getByText('Amount Payable').nextElementSibling?.textContent).toBe('₹ 0.00');
    });

    it('renders the pay button disabled with the No Payment Due label and ignores clicks', () => {
        const button = screen.getByRole('button', { name: 'No Payment Due' });
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(onPay).not.toHaveBeenCalled();
    });

    it('leaves Cancel and go back active', () => {
        const cancel = screen.getByRole('button', { name: 'Cancel and go back' });
        expect(cancel).toBeEnabled();
        fireEvent.click(cancel);
        expect(navigateMock).toHaveBeenCalledWith('/mobile-recharge-&-bills/postpaid');
    });

    it('keeps the 3D Secure note', () => {
        expect(screen.getByText('3D Secure Authentication')).toBeInTheDocument();
    });
});

describe('PaymentSummaryCard when a payment is due', () => {
    it('renders the pay label and forwards the click', () => {
        const onPay = vi.fn();
        render(
            <PaymentSummaryCard
                paymentSummary={platformFee}
                totalAmount={248}
                payLabel="Pay ₹ 248.00"
                isPayDisabled={false}
                isLoading={false}
                onPay={onPay}
            />
        );
        expect(screen.getByText('Amount Payable').nextElementSibling?.textContent).toBe('₹ 248.00');
        fireEvent.click(screen.getByRole('button', { name: 'Pay ₹ 248.00' }));
        expect(onPay).toHaveBeenCalledTimes(1);
    });
});
