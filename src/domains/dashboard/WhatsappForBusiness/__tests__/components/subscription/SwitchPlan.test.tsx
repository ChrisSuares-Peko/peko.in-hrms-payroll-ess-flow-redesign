import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SwitchPlan from '../../../components/subscription/SwitchPlan';
import { PlanType } from '../../../types';

describe('SwitchPlan Component', () => {
    const mockHandleChange = vi.fn();

    const renderComponent = (selectedType: PlanType) => {
        render(<SwitchPlan selectedType={selectedType} handleChange={mockHandleChange} />);
    };

    it('renders both Monthly and Annually options', () => {
        renderComponent(PlanType.Monthly);

        expect(screen.getByText(/Billed Monthly/i)).toBeInTheDocument();
        expect(screen.getByText(/Billed Annually/i)).toBeInTheDocument();
    });

    it('applies the correct style to the selected plan', () => {
        renderComponent(PlanType.Annually);

        const annuallyButton = screen.getByText(/Billed Annually/i).closest('div');
        expect(annuallyButton).toHaveClass('border-gray-300 shadow-md');

        const monthlyButton = screen.getByText(/Billed Monthly/i).closest('div');
        expect(monthlyButton).not.toHaveClass('border-gray-300 shadow-md');
    });

    it('calls handleChange when a plan option is clicked', () => {
        renderComponent(PlanType.Monthly);

        const annuallyButton = screen.getByText(/Billed Annually/i).closest('div');
        fireEvent.click(annuallyButton!);

        expect(mockHandleChange).toHaveBeenCalledWith(PlanType.Annually);
    });
});
