import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import SettingsPage from '../../pages/SettingsPage';

const mockGetVerificationCount = vi.fn();
vi.mock('../../hooks/useGetVerificationCount', () => ({
    default: () => mockGetVerificationCount(),
}));

const mockGetVerificationAddOns = vi.fn();
vi.mock('../../hooks/useGetVerificationAddOns', () => ({
    default: () => mockGetVerificationAddOns(),
}));

const mockGetVerificationAddOnHistory = vi.fn();
vi.mock('../../hooks/useGetVerificationAddOnHistory', () => ({
    default: () => mockGetVerificationAddOnHistory(),
}));

const mockHandleSubmission = vi.fn();
const mockUseVerificationPayment = vi.fn();
vi.mock('../../hooks/useVerificationPayment', () => ({
    default: (quantity: number) => mockUseVerificationPayment(quantity),
}));

vi.mock('../../components/VerificationPlanCard', () => ({
    default: (props: any) => (
        <div data-testid="verification-plan-card">{JSON.stringify(props)}</div>
    ),
}));

vi.mock('../../components/VerificationLimitBar', () => ({
    default: (props: any) => (
        <div data-testid="verification-limit-bar">{JSON.stringify(props)}</div>
    ),
}));

vi.mock('../../components/VerificationCountTag', () => ({
    default: (props: any) => (
        <button
            type="button"
            data-testid={`count-tag-${props.count}`}
            aria-pressed={props.selected}
            onClick={props.onClick}
        >
            {props.count}
        </button>
    ),
}));

describe('SettingsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetVerificationCount.mockReturnValue({
            countData: { usedLimit: 5, remaining: 5, exhausted: false },
            loading: false,
        });
        mockGetVerificationAddOns.mockReturnValue({
            addOnsData: { maxLimit: 10, baseLimit: 10, addonLimit: 0, unitPrice: 100 },
            loading: false,
        });
        mockGetVerificationAddOnHistory.mockReturnValue({
            addOnHistoryData: { records: [] },
            loading: false,
        });
        mockUseVerificationPayment.mockReturnValue({
            handleSubmission: mockHandleSubmission,
            loading: false,
        });
    });

    test('renders the plan card and limit bar with the add-on data', () => {
        render(<SettingsPage />);

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByTestId('verification-plan-card')).toBeInTheDocument();
        expect(screen.getByTestId('verification-limit-bar')).toHaveTextContent(
            '"showUpgradeButton":false'
        );
    });

    test('shows an error and does not submit when Upgrade is clicked without a selection', () => {
        render(<SettingsPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        expect(
            screen.getByText('Please select number of additional verifications.')
        ).toBeInTheDocument();
        expect(mockHandleSubmission).not.toHaveBeenCalled();
    });

    test('selects a denomination, shows the computed total, clears the error and submits on Upgrade', () => {
        render(<SettingsPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
        expect(
            screen.getByText('Please select number of additional verifications.')
        ).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('count-tag-10'));

        expect(
            screen.queryByText('Please select number of additional verifications.')
        ).not.toBeInTheDocument();
        expect(screen.getByText('Total additional amount', { exact: false })).toBeInTheDocument();
        expect(
            screen.getByText(
                (content, element) =>
                    element?.tagName.toLowerCase() === 'span' &&
                    content === '₹ 1,000.00 for 10 Verifications'
            )
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));

        expect(mockHandleSubmission).toHaveBeenCalledTimes(1);
        expect(mockUseVerificationPayment).toHaveBeenCalledWith(10);
    });

    test('shows the Upgrade button in a loading state while payment is submitting', () => {
        mockUseVerificationPayment.mockReturnValue({
            handleSubmission: mockHandleSubmission,
            loading: true,
        });

        render(<SettingsPage />);

        expect(screen.getByText('Upgrade').closest('button')).toHaveClass('ant-btn-loading');
    });
});
