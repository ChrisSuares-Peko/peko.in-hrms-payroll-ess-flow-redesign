import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SwitchPlan from '../../../components/pricingPlan/SwitchPlan';
import { PlanType } from '../../../types';

describe('SwitchPlan Component', () => {
    const mockHandleChange = vi.fn();
    const defaultProps = {
        selectedType: PlanType.Monthly,
        handleChange: mockHandleChange,
        discount: {
            monthly: 10,
            annually: 20,
        },
    };

    it('renders the component correctly', () => {
        render(<SwitchPlan {...defaultProps} />);

        expect(screen.getByText(/Billed Monthly/i)).toBeInTheDocument();
        expect(screen.getByText(/Billed Annually/i)).toBeInTheDocument();
    });

    it('displays discount tags when discount is available', () => {
        render(<SwitchPlan {...defaultProps} />);

        expect(screen.getByText(/Upto 10% off/i)).toBeInTheDocument();
        expect(screen.getByText(/Upto 20% off/i)).toBeInTheDocument();
    });

    it('triggers handleChange when a plan is clicked', () => {
        render(<SwitchPlan {...defaultProps} />);

        // Click on Annual plan
        fireEvent.click(screen.getByText(/Billed Annually/i));
        expect(mockHandleChange).toHaveBeenCalledWith(PlanType.Annually);

        // Click on Monthly plan
        fireEvent.click(screen.getByText(/Billed Monthly/i));
        expect(mockHandleChange).toHaveBeenCalledWith(PlanType.Monthly);
    });

    it('adds active styles to the selected plan', () => {
        const { rerender } = render(<SwitchPlan {...defaultProps} />);

        // Monthly should be selected initially
        const monthlyPlan = screen.getByText(/Billed Monthly/i).closest('div');
        expect(monthlyPlan).toHaveClass('border-gray-300 shadow-md');

        // Change selection to Annually
        rerender(<SwitchPlan {...defaultProps} selectedType={PlanType.Annually} />);
        const annualPlan = screen.getByText(/Billed Annually/i).closest('div');
        expect(annualPlan).toHaveClass('border-gray-300 shadow-md');
    });
});
