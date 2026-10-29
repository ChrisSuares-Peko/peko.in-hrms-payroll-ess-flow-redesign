/**
 * @file index.test.tsx
 * @description Unit tests for subscription Description component
 * Verifies:
 *  - Renders null when product is null
 *  - Renders plan selection heading
 *  - Renders pricing overview text
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Description from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Description/index';
import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';

vi.mock('@src/domains/dashboard/softwares/contexts/SubscriptionPageContext', () => ({
    useSubscriptionContext: vi.fn(),
}));

const mockedUseSubscriptionContext = vi.mocked(useSubscriptionContext);

describe('subscription Description', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null when product is null', () => {
        mockedUseSubscriptionContext.mockReturnValue({ isLoading: false, product: null } as any);
        const { container } = render(<Description />);
        expect(container.firstChild).toBeNull();
    });

    it('should render plan selection heading', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: { pricing_overview: 'Choose the plan that suits you' },
        } as any);
        render(<Description />);
        expect(screen.getByText('Select the plan that works for you')).toBeInTheDocument();
    });

    it('should render pricing overview text', () => {
        mockedUseSubscriptionContext.mockReturnValue({
            isLoading: false,
            product: { pricing_overview: 'Choose the plan that suits you' },
        } as any);
        render(<Description />);
        expect(screen.getByText('Choose the plan that suits you')).toBeInTheDocument();
    });
});
