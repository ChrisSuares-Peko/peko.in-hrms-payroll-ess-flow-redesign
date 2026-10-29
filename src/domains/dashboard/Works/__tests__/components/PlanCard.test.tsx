import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { JSX } from 'react/jsx-runtime';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import PlanCard from '../../components/PlanCard';

const renderWithRouter = (
    component: string | number | boolean | Iterable<ReactNode> | JSX.Element | null | undefined
) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('PlanCard Component', () => {
    const mockPlan = {
        planId: 1,
        planName: 'Pro Plan',
        price: '999',
        billingCycle: 'month',
        description: 'Best plan for professionals',
        feature: 'Feature 1\nFeature 2\nFeature 3',
        workId: '123',
        isPopular: true,
    };

    it('should render without crashing', () => {
        renderWithRouter(<PlanCard {...mockPlan} />);
        expect(screen.getByText(`₹ ${mockPlan.price}`)).toBeInTheDocument();
        expect(screen.getByText(`/${mockPlan.billingCycle}`)).toBeInTheDocument();
        expect(screen.getByText(mockPlan.planName)).toBeInTheDocument();
    });

    it('should display all features correctly', () => {
        renderWithRouter(<PlanCard {...mockPlan} />);
        mockPlan.feature.split('\n').forEach(feature => {
            expect(screen.getByText(content => content.includes(feature))).toBeInTheDocument();
        });
    });

    it('should handle missing features gracefully', () => {
        renderWithRouter(<PlanCard {...mockPlan} feature="" />);
        expect(screen.queryByText('Feature 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });

    it('should render empty state when features list is empty', () => {
        renderWithRouter(<PlanCard {...mockPlan} feature="" />);
        expect(screen.queryByText('Feature 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Feature 3')).not.toBeInTheDocument();
    });

    // it('should render discount badge if discountPercentage > 0', () => {
    //     renderWithRouter(<PlanCard {...mockPlan} discountPercentage={10} />);
    //     expect(screen.getByText(/Save upto 10%/i)).toBeInTheDocument();
    // });

    it('should render purchase button with correct link', () => {
        renderWithRouter(<PlanCard {...mockPlan} />);
        const purchaseButton = screen.getByRole('link', { name: /Purchase/i });
        expect(purchaseButton).toHaveAttribute('href', `/purchase/${mockPlan.planId}`);
    });
});
