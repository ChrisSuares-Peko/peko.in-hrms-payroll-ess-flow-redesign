import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import couponAppliedAnimation from '@assets/animation/coupon-applied.json';

import CouponAppliedPopup from '../../components/CouponAppliedPopup';

// lottie-web reads a canvas 2d context at import time, which jsdom does not provide.
vi.mock('react-lottie', () => ({
    default: () => <div data-testid="lottie" />,
}));

describe('CouponAppliedPopup', () => {
    it('ships a valid coupon-applied lottie animation', () => {
        expect(couponAppliedAnimation.v).toBe('4.8.0');
        expect(couponAppliedAnimation.fr).toBe(25);
        expect(couponAppliedAnimation.op).toBe(116);
        expect(couponAppliedAnimation.layers.length).toBeGreaterThan(0);
    });

    it('renders the applied code and the celebration copy', () => {
        render(<CouponAppliedPopup open couponCode="SAVE10" onClose={vi.fn()} />);

        expect(screen.getByText('Coupon Applied!')).toBeInTheDocument();
        expect(screen.getByText('SAVE10')).toBeInTheDocument();
    });

    it('auto-closes only after the animation has played its motion', () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        try {
            render(<CouponAppliedPopup open couponCode="SAVE10" onClose={onClose} />);

            // Frame 76 of 116 at 25fps is when the motion lands (~3.04s) — it must not
            // close before then.
            act(() => {
                vi.advanceTimersByTime(3040);
            });
            expect(onClose).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(onClose).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it('does not schedule a close while it is shut', () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        try {
            render(<CouponAppliedPopup open={false} couponCode="SAVE10" onClose={onClose} />);
            act(() => {
                vi.advanceTimersByTime(10000);
            });
            expect(onClose).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });
});
