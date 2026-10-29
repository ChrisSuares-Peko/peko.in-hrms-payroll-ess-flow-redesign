import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { JSX } from 'react/jsx-runtime';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import SelectPlanSectionCard from '../../components/SelectPlanCard'; // Adjust path accordingly

describe('SelectPlanSectionCard Component', () => {
    const mockPlan = {
        title: 'Premium Plan',
        amount: 999,
        monthlyCost: '₹ 83 per month',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
    };

    const renderWithRouter = (
        component: string | number | boolean | Iterable<ReactNode> | JSX.Element | null | undefined
    ) => render(<BrowserRouter>{component}</BrowserRouter>);

    it('should render correctly', () => {
        renderWithRouter(<SelectPlanSectionCard {...mockPlan} />);
        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('₹ 999')).toBeInTheDocument();
        expect(screen.getByText('₹ 83 per month')).toBeInTheDocument();
    });

    it('should display all features', () => {
        renderWithRouter(<SelectPlanSectionCard {...mockPlan} />);

        mockPlan.features.forEach(feature => {
            expect(screen.getByText(content => content.includes(feature))).toBeInTheDocument();
        });
    });

    it('should have a purchase button with the correct link', () => {
        renderWithRouter(<SelectPlanSectionCard {...mockPlan} />);
        const purchaseButton = screen.getByRole('button', { name: 'Purchase' });
        expect(purchaseButton).toBeInTheDocument();

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/works/purchased');
    });
});
