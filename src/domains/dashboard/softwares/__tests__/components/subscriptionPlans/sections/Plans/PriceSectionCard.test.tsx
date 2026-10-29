/**
 * @file PriceSectionCard.test.tsx
 * @description Unit tests for PriceSectionCard component
 * Verifies:
 *  - Renders plan name
 *  - Renders Select Plan when payable amount > 0
 *  - Renders Request for Quote when amount is 0
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PriceSectionCard from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionCard';
import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';
import useGetAssistance from '@src/domains/dashboard/softwares/hooks/general/useGetAssistance';

vi.mock('@src/domains/dashboard/softwares/contexts/SubscriptionPageContext', () => ({
    useSubscriptionContext: vi.fn(),
}));
vi.mock('@src/domains/dashboard/softwares/hooks/general/useGetAssistance', () => ({
    default: vi.fn(),
}));
vi.mock('@src/assets/images/dirham.png', () => ({ default: 'dirham.png' }));

const mockedUseSubscriptionContext = vi.mocked(useSubscriptionContext);
const mockedUseGetAssistance = vi.mocked(useGetAssistance);

const basePricingOption = {
    amount: 100,
    billingCycle: 'monthly',
    currency: 'AED',
    discountedAmount: 100,
    discountedAmountInConvertedCurrency: '100',
    discountPercentage: '0',
    amountInConvertedCurrency: '100',
    ratePeriod: 'per_month',
};

const defaultProps = {
    purchaseOption: { plan: { name: 'Basic' }, sku: { code: 'basic-sku' } },
    productName: 'Software X',
    weburl: 'software-x',
    pricingOption: basePricingOption,
    company: 'Corp',
};

describe('PriceSectionCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseSubscriptionContext.mockReturnValue({
            handleSoftwareSubmission: vi.fn(),
        } as any);
        mockedUseGetAssistance.mockReturnValue({
            isLoading: false,
            requestAssistance: vi.fn(),
        } as any);
    });

    it('should render plan name', () => {
        render(<PriceSectionCard {...(defaultProps as any)} />);
        expect(screen.getByText('Basic')).toBeInTheDocument();
    });

    it('should render Select Plan when payable amount > 0', () => {
        render(<PriceSectionCard {...(defaultProps as any)} />);
        expect(screen.getByText('Select Plan')).toBeInTheDocument();
    });

    it('should render Request for Quote when amount is 0', () => {
        const freePricingOption = {
            ...basePricingOption,
            discountedAmountInConvertedCurrency: '0',
            amountInConvertedCurrency: '0',
        };
        render(
            <PriceSectionCard {...(defaultProps as any)} pricingOption={freePricingOption as any} />
        );
        expect(screen.getByText('Request for Quote')).toBeInTheDocument();
    });
});
