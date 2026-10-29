/**
 * @file PriceSectionRFQ.test.tsx
 * @description Unit tests for PriceSectionRFQ component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders plan cards from pricing array
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PriceSectionRFQ from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionRFQ';
import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SubscriptionPageContext', () => ({
    useSubscriptionContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionRFPCard',
    () => ({
        default: ({ planName }: any) => <div data-testid="rfp-card">{planName}</div>,
    })
);
vi.mock(
    '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/FeaturesSection',
    () => ({
        default: () => <div data-testid="features" />,
    })
);

const mockedUseSubscriptionContext = vi.mocked(useSubscriptionContext);

describe('PriceSectionRFQ', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseSubscriptionContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<PriceSectionRFQ />);
        expect(container.firstChild).toBeNull();
    });

    it('should render plan cards for each pricing entry', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: {
                weburl: 'software-x',
                pricing: [
                    {
                        plan: 'Basic',
                        amountInConvertedCurrency: '100',
                        period: 'month',
                        isPlanFree: false,
                        description: [],
                    },
                    {
                        plan: 'Pro',
                        amountInConvertedCurrency: '200',
                        period: 'month',
                        isPlanFree: false,
                        description: [],
                    },
                ],
            },
        } as any);
        render(<PriceSectionRFQ />);
        expect(screen.getAllByTestId('rfp-card')).toHaveLength(2);
    });
});
