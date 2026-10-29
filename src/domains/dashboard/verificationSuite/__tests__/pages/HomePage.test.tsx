import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import HomePage from '../../pages/HomePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('../../components/HeaderBanner', () => ({
    default: () => <div data-testid="header-banner" />,
}));

vi.mock('../../components/HomePageHeader', () => ({
    default: () => <div data-testid="home-page-header" />,
}));

vi.mock('../../components/VerificationLimitBar', () => ({
    default: (props: any) => (
        <div data-testid="verification-limit-bar">{JSON.stringify(props)}</div>
    ),
}));

const verificationCardMock = vi.fn();
vi.mock('../../components/VerificationCard', () => ({
    default: (props: any) => {
        verificationCardMock(props);
        return (
            <button type="button" data-testid={`verification-card-${props.accessKeys}`} onClick={props.onModalClose}>
                {props.title}
            </button>
        );
    },
}));

vi.mock('../../utils/data', () => ({
    identityVerification: [
        { title: 'PAN Verification', desc: 'pan desc', logo: 'pan.png', accessKey: 'pan_verify', serviceName: 'PAN', inputComponents: [] },
        { title: 'Aadhaar Verification', desc: 'aadhaar desc', logo: 'aadhaar.png', accessKey: 'aadhar_verify', serviceName: 'Aadhaar', inputComponents: [] },
    ],
    businessVerification: [
        { title: 'GSTIN Verification', desc: 'gst desc', logo: 'gst.png', accessKey: 'gstin_verify', serviceName: 'GSTIN', inputComponents: [] },
    ],
}));

const mockGetAllPrice = vi.fn();
vi.mock('../../hooks/useGetPriceApi', () => ({
    default: () => mockGetAllPrice(),
}));

const mockRefreshCount = vi.fn();
const mockGetVerificationCount = vi.fn();
vi.mock('../../hooks/useGetVerificationCount', () => ({
    default: () => mockGetVerificationCount(),
}));

const mockRefreshAddOns = vi.fn();
const mockGetVerificationAddOns = vi.fn();
vi.mock('../../hooks/useGetVerificationAddOns', () => ({
    default: () => mockGetVerificationAddOns(),
}));

const mockVerificationPlan = vi.fn();
vi.mock('../../hooks/useVerificationPlan', () => ({
    default: () => mockVerificationPlan(),
}));

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetAllPrice.mockReturnValue({
            loading: false,
            priceData: { pan_verify: true, aadhar_verify: true, gstin_verify: true },
        });
        mockGetVerificationCount.mockReturnValue({
            countData: { usedLimit: 5, remaining: 5, exhausted: false },
            loading: false,
            refresh: mockRefreshCount,
        });
        mockGetVerificationAddOns.mockReturnValue({
            addOnsData: { maxLimit: 10, baseLimit: 10, addonLimit: 0, unitPrice: 100 },
            loading: false,
            refresh: mockRefreshAddOns,
        });
        mockVerificationPlan.mockReturnValue({ plan: { id: 'plan-1' } });
    });

    test('shows a skeleton while prices are loading and skips rendering the verification sections', () => {
        mockGetAllPrice.mockReturnValue({ loading: true, priceData: undefined });

        render(<HomePage />);

        expect(screen.getByTestId('home-page-header')).toBeInTheDocument();
        expect(screen.getByTestId('header-banner')).toBeInTheDocument();
        expect(screen.queryByText('Identity Verification')).not.toBeInTheDocument();
        expect(screen.queryByText('Business Verification')).not.toBeInTheDocument();
    });

    test('renders only the identity and business cards available in priceData', () => {
        mockGetAllPrice.mockReturnValue({
            loading: false,
            priceData: { pan_verify: true, aadhar_verify: false, gstin_verify: true },
        });

        render(<HomePage />);

        expect(screen.getByTestId('verification-card-pan_verify')).toBeInTheDocument();
        expect(screen.queryByTestId('verification-card-aadhar_verify')).not.toBeInTheDocument();
        expect(screen.getByTestId('verification-card-gstin_verify')).toBeInTheDocument();

        expect(verificationCardMock).toHaveBeenCalledWith(
            expect.objectContaining({
                accessKeys: 'pan_verify',
                exhausted: false,
                maxLimit: 10,
            })
        );
    });

    test('navigates to verification history when the Identity Verification title is clicked', () => {
        render(<HomePage />);

        fireEvent.click(screen.getByText('Identity Verification'));

        expect(mockNavigate).toHaveBeenCalledWith('verification-history');
    });

    test('refreshes count and add-ons data when a verification card closes its modal', () => {
        render(<HomePage />);

        fireEvent.click(screen.getByTestId('verification-card-pan_verify'));

        expect(mockRefreshCount).toHaveBeenCalledTimes(1);
        expect(mockRefreshAddOns).toHaveBeenCalledTimes(1);
    });
});
