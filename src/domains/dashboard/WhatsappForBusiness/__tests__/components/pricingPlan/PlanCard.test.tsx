import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, Mock } from 'vitest';

import { calculateDiscount } from '@src/domains/dashboard/plans/utils';

import PlanCard from '../../../components/pricingPlan/PlanCard';
import { PlanMode, PlanType } from '../../../types';

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(value => value.toString()),
}));

vi.mock('@src/domains/dashboard/plans/utils', () => ({
    calculateDiscount: vi.fn(() => ({
        discountedAmount: 1000,
        discountPercentage: 20,
    })),
}));

describe('PlanCard Component', () => {
    const mockOnSelectPlan = vi.fn();
    const mockOnPurchasePlan = vi.fn(() => Promise.resolve());

    const defaultProps = {
        planId: 1,
        planName: 'WhatsApp Pro' as PlanMode,
        price: 1200,
        discount: 20,
        feature: ['Feature 1', 'Feature 2'],
        benefits: ['Benefit 1'],
        selectedType: 'WhatsApp Pro' as PlanMode,
        onSelectPlan: mockOnSelectPlan,
        onPurchasePlan: mockOnPurchasePlan,
        seletedDuration: 'monthly' as PlanType,
    };

    it('renders correctly with plan details', () => {
        render(<PlanCard {...defaultProps} />);
        expect(screen.getByText('Pro')).toBeInTheDocument();
        expect(screen.getByText('Save upto 20%')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('/month')).toBeInTheDocument();
    });

    it('does not show discount label when discount is 0', () => {
        (calculateDiscount as Mock).mockReturnValueOnce({
            discountedAmount: 1200,
            discountPercentage: 0,
        });
        render(<PlanCard {...defaultProps} discount={0} />);
        expect(screen.queryByText(/Save upto/i)).not.toBeInTheDocument();
    });

    it('calls onSelectPlan and onPurchasePlan on button click', async () => {
        render(<PlanCard {...defaultProps} />);
        const button = screen.getByText('Purchase');

        fireEvent.click(button);
        expect(mockOnSelectPlan).toHaveBeenCalledWith('WhatsApp Pro', 1, 1200, 1000);
        expect(mockOnPurchasePlan).toHaveBeenCalledWith(
            expect.any(Function),
            'WhatsApp Pro',
            'monthly',
            1,
            1000
        );
    });

    it('shows loading state on purchase button when clicked', async () => {
        render(<PlanCard {...defaultProps} />);
        const button = screen.getByText('Purchase').closest('button');

        fireEvent.click(button!);

        expect(button).toHaveClass('ant-btn-loading');
    });

    it('renders ListPoints component with features and benefits', () => {
        render(<PlanCard {...defaultProps} />);
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
        expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    });

    it('does not show benefits section when empty', () => {
        render(<PlanCard {...defaultProps} benefits={[]} />);
        expect(screen.queryByText('Benefit 1')).not.toBeInTheDocument();
    });
});
