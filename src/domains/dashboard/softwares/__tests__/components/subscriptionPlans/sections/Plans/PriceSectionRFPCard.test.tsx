/**
 * @file PriceSectionRFPCard.test.tsx
 * @description Unit tests for PriceSectionRFPCard component
 * Verifies:
 *  - Renders plan name
 *  - Renders Free Plan text when isPlanFree is true
 *  - Renders Request for Quote when not free
 */

import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PriceSectionRFPCard from '@src/domains/dashboard/softwares/components/subscriptionPlans/sections/Plans/PriceSectionRFPCard';
import useGetAssistance from '@src/domains/dashboard/softwares/hooks/general/useGetAssistance';

vi.mock('@src/domains/dashboard/softwares/hooks/general/useGetAssistance', () => ({
    default: vi.fn(),
}));
vi.mock('@src/assets/images/dirham.png', () => ({ default: 'dirham.png' }));

const mockedUseGetAssistance = vi.mocked(useGetAssistance);

const defaultProps = {
    planName: 'Starter',
    weburl: 'software-x',
    amountInConvertedCurrency: '200',
    period: 'month',
    isPlanFree: false,
};

describe('PriceSectionRFPCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseGetAssistance.mockReturnValue({
            isLoading: false,
            requestAssistance: vi.fn(),
        } as any);
    });

    it('should render plan name', () => {
        render(<PriceSectionRFPCard {...defaultProps} />);
        expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    it('should render Request for Quote when not free', () => {
        render(<PriceSectionRFPCard {...defaultProps} />);
        expect(screen.getByText('Request for Quote')).toBeInTheDocument();
    });

    it('should render Free Plan when isPlanFree is true', () => {
        render(<PriceSectionRFPCard {...defaultProps} isPlanFree />);
        expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });
});
