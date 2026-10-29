import { createRef } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import CouponCodeCard from '../../components/CouponCodeCard';

const REQUIRED_MESSAGE = 'Please enter coupon/discount code';
const MIN_LENGTH_MESSAGE = 'Coupon code must be at least 3 characters';

const renderCard = (overrides: Partial<React.ComponentProps<typeof CouponCodeCard>> = {}) => {
    const couponFormikRef = createRef<
        FormikProps<{ couponCode: string }>
    >() as React.MutableRefObject<FormikProps<{ couponCode: string }> | null>;
    const props = {
        applyCoupon: vi.fn(),
        isApplied: false,
        appliedCouponCode: '',
        couponFormikRef,
        setCouponCode: vi.fn(),
        removeCoupon: vi.fn(),
        isDisabled: false,
        ...overrides,
    };
    return { ...render(<CouponCodeCard {...props} />), props };
};

const getInput = () => screen.getByPlaceholderText('Enter code') as HTMLInputElement;

describe('CouponCodeCard', () => {
    // The coupon is optional on this screen, so an emptied field must be neutral. Waiting for
    // the min-length error to appear first proves the validation cycle really ran, so the
    // follow-up assertions cannot pass by racing ahead of async validation.
    it('clears the validation error when the field is emptied, and never demands a code', async () => {
        renderCard();
        const input = getInput();

        fireEvent.change(input, { target: { value: 'AB' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.getByText(MIN_LENGTH_MESSAGE)).toBeInTheDocument();
        });

        fireEvent.change(input, { target: { value: '' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.queryByText(MIN_LENGTH_MESSAGE)).not.toBeInTheDocument();
        });

        expect(screen.queryByText(REQUIRED_MESSAGE)).not.toBeInTheDocument();
    });

    it('still rejects a too-short code on blur', async () => {
        renderCard();
        const input = getInput();

        fireEvent.change(input, { target: { value: 'AB' } });
        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(MIN_LENGTH_MESSAGE)).toBeInTheDocument();
        });
    });

    it('accepts a valid code without complaint', async () => {
        renderCard();
        const input = getInput();

        fireEvent.change(input, { target: { value: 'SAVE10' } });
        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.queryByText(MIN_LENGTH_MESSAGE)).not.toBeInTheDocument();
        });

        expect(screen.queryByText(REQUIRED_MESSAGE)).not.toBeInTheDocument();
    });

    it('uppercases and strips punctuation as the user types', () => {
        const { props } = renderCard();
        const input = getInput();

        fireEvent.change(input, { target: { value: 'sa-ve!10' } });

        expect(input.value).toBe('SAVE10');
        expect(props.setCouponCode).toHaveBeenLastCalledWith('SAVE10');
    });

    it('keeps Apply disabled until something is typed, and re-disables on clear', () => {
        renderCard();
        const input = getInput();
        const apply = screen.getByRole('button', { name: /apply/i });

        expect(apply).toBeDisabled();

        fireEvent.change(input, { target: { value: 'SAVE10' } });
        expect(apply).toBeEnabled();

        fireEvent.change(input, { target: { value: '' } });
        expect(apply).toBeDisabled();
    });

    it('submits the typed code through applyCoupon', async () => {
        const { props } = renderCard();
        fireEvent.change(getInput(), { target: { value: 'SAVE10' } });
        fireEvent.click(screen.getByRole('button', { name: /apply/i }));

        await waitFor(() => {
            expect(props.applyCoupon).toHaveBeenCalledWith('SAVE10', expect.any(Function));
        });
    });

    it('offers Remove instead of Apply once a coupon is applied', () => {
        renderCard({ isApplied: true, appliedCouponCode: 'SAVE10' });

        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^apply$/i })).not.toBeInTheDocument();
        expect(getInput()).toBeDisabled();
    });

    it('calls removeCoupon when Remove is clicked', () => {
        const { props } = renderCard({ isApplied: true, appliedCouponCode: 'SAVE10' });
        fireEvent.click(screen.getByRole('button', { name: /remove/i }));

        expect(props.removeCoupon).toHaveBeenCalledTimes(1);
    });
});
