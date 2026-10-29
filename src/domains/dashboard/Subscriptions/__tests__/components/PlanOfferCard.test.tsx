import React from 'react';

import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { describe, it, expect, Mock, vi, afterEach, beforeEach } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanOfferCard from '../../components/subscriptionDetails/PlanOfferCard'; // Adjust path as needed
import { getUserDisplayText } from '../../utils/data';

vi.mock('react-router-dom', async importOriginal => {
    const actual: {} = await importOriginal();
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

vi.mock('../../utils/data', () => ({
    getUserDisplayText: vi.fn(),
}));

describe('PlanOfferCard', () => {
    const mockNavigate = vi.fn();
    beforeEach(() => {
        (useNavigate as Mock).mockReturnValue(mockNavigate);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', async () => {
        const mockedFormatNumberWithLocalString = formatNumberWithLocalString as Mock;
        const mockedgetUserDisplayText = getUserDisplayText as Mock;
        // Mock the return value
        mockedFormatNumberWithLocalString.mockReturnValue('100.00');
        mockedgetUserDisplayText.mockReturnValue('5 Users');

        render(
            <Router>
                <PlanOfferCard
                    title="Test Plan"
                    period="Monthly"
                    amount="100"
                    monthlyCost="10"
                    offer="Special Offer"
                    features={'Feature 1\nFeature 2'}
                    id="123"
                    noOfUser={5}
                />
            </Router>
        );
        expect(screen.getByText('Test Plan')).toBeInTheDocument();

        expect(screen.getByText('Monthly 5 Users')).toBeInTheDocument();
        expect(screen.getByTestId('amount')).toBeInTheDocument();

        expect(screen.getByText('Special Offer')).toBeInTheDocument();

        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    it('displays the formatted amount correctly', () => {
        (formatNumberWithLocalString as Mock).mockReturnValue('100.00');
        render(
            <Router>
                <PlanOfferCard
                    title="Test Plan"
                    period="Monthly"
                    amount="100"
                    monthlyCost="10"
                    offer="Special Offer"
                    features="Feature 1\nFeature 2"
                    id="123"
                    noOfUser={5}
                />
            </Router>
        );
        expect(screen.getByTestId('amount')).toBeInTheDocument();
    });

    it('handles button click correctly', () => {
        render(
            <Router>
                <PlanOfferCard
                    title="Test Plan"
                    period="Monthly"
                    amount="100"
                    monthlyCost="10"
                    offer="Special Offer"
                    features="Feature 1\nFeature 2"
                    id="123"
                    noOfUser={5}
                />
            </Router>
        );
        fireEvent.click(screen.getByText('Purchase'));
        expect(mockNavigate).toHaveBeenCalledWith('/softwares/purchase/123');
    });

    it('renders feature list correctly', () => {
        render(
            <Router>
                <PlanOfferCard
                    title="Test Plan"
                    period="Monthly"
                    amount="100"
                    monthlyCost="10"
                    offer="Special Offer"
                    features={'Feature 1\nFeature 2'}
                    id="123"
                    noOfUser={5}
                />
            </Router>
        );
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });
});
