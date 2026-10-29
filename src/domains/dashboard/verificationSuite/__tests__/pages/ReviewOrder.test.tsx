import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import ReviewOrder from '../../pages/ReviewOrder';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

const mockUseAppSelector = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) => mockUseAppSelector(selector),
}));

vi.mock('../../components/VerificationAddonReviewCard', () => ({
    default: () => <div data-testid="verification-addon-review-card" />,
}));

describe('ReviewOrder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('redirects to settings and renders nothing when there is no bill summary', () => {
        mockUseAppSelector.mockImplementation((selector: any) =>
            selector({ reducer: { payment: { billSummary: [] } } })
        );

        const { container } = render(<ReviewOrder />);

        expect(mockNavigate).toHaveBeenCalledWith('/verification-suite/settings');
        expect(container).toBeEmptyDOMElement();
    });

    test('renders the order review with the addon card when a bill summary exists', () => {
        mockUseAppSelector.mockImplementation((selector: any) =>
            selector({
                reducer: {
                    payment: {
                        billSummary: [{ key: 'Verifications', value: 10 }],
                    },
                },
            })
        );

        render(<ReviewOrder />);

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByText('Review your order')).toBeInTheDocument();
        expect(screen.getByTestId('verification-addon-review-card')).toBeInTheDocument();
    });

    test('navigates back to settings when Go Back is clicked', () => {
        mockUseAppSelector.mockImplementation((selector: any) =>
            selector({
                reducer: {
                    payment: {
                        billSummary: [{ key: 'Verifications', value: 10 }],
                    },
                },
            })
        );

        render(<ReviewOrder />);

        fireEvent.click(screen.getByText('Go Back'));

        expect(mockNavigate).toHaveBeenCalledWith('/verification-suite/settings');
    });
});
