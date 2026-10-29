import { render, fireEvent } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import Plans from '../../components/Plans';

describe('Plans Component', () => {
    beforeAll(() => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    it('renders loading skeletons when isLoading is true', () => {
        const { getAllByRole } = render(
            <Plans
                isLoading
                plansData={[]}
                selectedType="Monthly"
                handleChange={() => {}}
                isFormSubmitted={false}
                handlePurchase={() => {}}
            />
        );

        const skeletons = getAllByRole('heading', { hidden: true });
        expect(skeletons.length).toBe(3); // Expect one skeleton title

        const skeletonsByClass = document.querySelectorAll('.ant-skeleton');
        expect(skeletonsByClass.length).toBe(3); // Expect three skeleton components

        skeletonsByClass.forEach(skeleton => {
            expect(skeleton).toBeInTheDocument();
            expect(skeleton).toHaveClass('ant-skeleton-active'); // or any other class you want to verify
        });
    });

    it('renders empty state when no plans are available', () => {
        const { getByText } = render(
            <Plans
                isLoading={false}
                plansData={[]}
                selectedType="Monthly"
                handleChange={() => {}}
                isFormSubmitted={false}
                handlePurchase={() => {}}
            />
        );

        expect(getByText('No plans to show')).toBeInTheDocument();
    });
    it('renders SwitchPlan when plans are available and not loading', () => {
        const mockPlansData = [
            {
                id: 1,
                name: 'Basic Plan',
                features: [],
                monthlyPrice: '100',
                yearlyPrice: '1000',
                descriptions: [],
                image_url: '',
                softwaresSubscriptionId: 78,
                status: true,
            },
        ];

        const { getByText } = render(
            <Plans
                isLoading={false}
                plansData={mockPlansData}
                selectedType="Monthly"
                handleChange={() => {}}
                isFormSubmitted={false}
                handlePurchase={() => {}}
            />
        );

        expect(getByText('Basic Plan')).toBeInTheDocument();
    });

    it('calls handlePurchase with correct parameters when Purchase button is clicked', () => {
        const handlePurchaseMock = vi.fn();
        const mockPlansData = [
            {
                id: 1,
                name: 'Basic Plan',
                features: [],
                monthlyPrice: '100',
                yearlyPrice: '1000',
                descriptions: [],
                image_url: '',
                softwaresSubscriptionId: 78,
                status: true,
            },
        ];

        const { getByText } = render(
            <Plans
                isLoading={false}
                plansData={mockPlansData}
                selectedType="Monthly"
                handleChange={() => {}}
                isFormSubmitted={false}
                handlePurchase={handlePurchaseMock}
            />
        );

        fireEvent.click(getByText('Purchase'));
        expect(handlePurchaseMock).toHaveBeenCalledWith({
            amount: '100',
            planId: 1,
            planName: 'Basic Plan',
        });
    });
});
