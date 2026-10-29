/**
 * @file index.test.tsx
 * @description Unit tests for Plans component
 * Verifies:
 *  - Returns null when product is null
 *  - Renders empty state when no plans
 *  - Renders PriceSection when hasPurchaseOptions is true
 *  - Renders PriceSectionRFQ when no purchase options but pricing exists
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Plans from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/index';
import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SubscriptionPageContext', () => ({
    useSubscriptionContext: vi.fn(),
}));
vi.mock(
    '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSection',
    () => ({
        default: () => <div>PriceSection</div>,
    })
);
vi.mock(
    '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionRFQ',
    () => ({
        default: () => <div>PriceSectionRFQ</div>,
    })
);

const mockedUseSubscriptionContext = vi.mocked(useSubscriptionContext);

describe('Plans', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseSubscriptionContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<Plans />);
        expect(container.firstChild).toBeNull();
    });

    it('should render empty state when no plans at all', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: { hasPurchaseOptions: false, pricing: [] },
        } as any);
        render(<Plans />);
        expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    });

    it('should render PriceSection when hasPurchaseOptions is true', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: { hasPurchaseOptions: true, pricing: [] },
        } as any);
        render(<Plans />);
        expect(screen.getByText('PriceSection')).toBeInTheDocument();
    });

    it('should render PriceSectionRFQ when no purchase options but pricing exists', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: {
                hasPurchaseOptions: false,
                pricing: [{ plan: 'Basic', description: [] }],
            },
        } as any);
        render(<Plans />);
        expect(screen.getByText('PriceSectionRFQ')).toBeInTheDocument();
    });
});
