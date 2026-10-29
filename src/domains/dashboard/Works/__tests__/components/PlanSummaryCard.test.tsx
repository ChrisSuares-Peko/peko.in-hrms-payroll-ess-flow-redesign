import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { JSX } from 'react/jsx-runtime';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import PlanSummaryCard from '../../components/PlanSummaryCard';

const renderWithRouter = (
    component: string | number | boolean | Iterable<ReactNode> | JSX.Element | null | undefined
) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('PlanSummaryCard Component', () => {
    const mockPlan = {
        id: 1,
        name: 'Pro Plan',
        price: '₹ 999',
        billingCycle: 'per month',
        description: 'Best plan for professionals',
        features: 'Feature 1\n Feature 2\n Feature 3',
    };

    it('should render without crashing', () => {
        renderWithRouter(<PlanSummaryCard {...mockPlan} />);
        expect(screen.getByText(mockPlan.name)).toBeInTheDocument();
        expect(screen.getByText(mockPlan.price)).toBeInTheDocument();
        expect(screen.getByText(mockPlan.billingCycle)).toBeInTheDocument();
        expect(screen.getByText(mockPlan.description)).toBeInTheDocument();
    });

    it('should display all features correctly', () => {
        renderWithRouter(<PlanSummaryCard {...mockPlan} />);
        mockPlan.features.split('\n ').forEach(feature => {
            expect(screen.getByText(content => content.includes(feature))).toBeInTheDocument();
        });
    });

    it('should handle missing features gracefully', () => {
        renderWithRouter(<PlanSummaryCard {...mockPlan} features={null} />);
        expect(screen.queryByText('Feature 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });

    it('should render empty state when features list is empty', () => {
        renderWithRouter(<PlanSummaryCard {...mockPlan} features="" />);
        expect(screen.queryByText('Feature 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });
});
