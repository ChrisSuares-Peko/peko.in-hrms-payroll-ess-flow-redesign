/**
 * @file PriceSection.test.tsx
 * @description Unit tests for PriceSection component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders purchase option cards when product has purchaseOptions
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PriceSection from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSection';
import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SubscriptionPageContext', () => ({
    useSubscriptionContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionCard',
    () => ({
        default: ({ productName }: any) => <div data-testid="price-card">{productName}</div>,
    })
);

const mockedUseSubscriptionContext = vi.mocked(useSubscriptionContext);

describe('PriceSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseSubscriptionContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<PriceSection />);
        expect(container.firstChild).toBeNull();
    });

    it('should render price cards for each purchase option with pricingOption', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: {
                product_name: 'Software X',
                weburl: 'software-x',
                company: 'Corp',
                purchaseOptions: [
                    {
                        plan: { name: 'Basic' },
                        sku: {
                            code: 'basic-sku',
                            pricingOption: {
                                amount: 100,
                                billingCycle: 'monthly',
                                currency: 'AED',
                                discountedAmount: 100,
                                discountedAmountInConvertedCurrency: '100',
                                discountPercentage: '0',
                                amountInConvertedCurrency: '100',
                                ratePeriod: 'per_month',
                            },
                        },
                    },
                ],
            },
        } as any);
        render(<PriceSection />);
        expect(screen.getAllByTestId('price-card')).toHaveLength(1);
    });
});
