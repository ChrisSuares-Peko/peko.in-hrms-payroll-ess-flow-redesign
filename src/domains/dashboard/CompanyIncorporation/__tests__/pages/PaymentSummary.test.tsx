import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import PaymentSummary from '../../pages/PaymentSummary';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/services/surcharge', () => ({
    getSurcharge: vi.fn().mockResolvedValue({ surcharge: 0, surchargeType: 'FLAT' }),
}));

vi.mock('../../api', () => ({
    getApplications: vi.fn().mockResolvedValue({ applications: [] }),
    getApplicationDetail: vi.fn().mockResolvedValue(false),
    getLandingConfig: vi.fn().mockResolvedValue({ incorporationFee: 10000 }),
}));

// Shared payments module — exercised by its own domain tests; stub here.
vi.mock('../../../payments/hooks/usePaymentApi', () => ({
    default: () => ({
        handleWalletPaymentRequest: vi.fn(),
        handlePaytmPaymentRequest: vi.fn(),
        isLoading: false,
        isSpinnerLoading: false,
        loadCheckoutScript: vi.fn(),
    }),
}));

vi.mock('../../../payments/hooks/useWalletApi', () => ({
    default: () => ({ walletData: { balance: 50000 } }),
}));

vi.mock('../../../payments/hooks/useGetAllPaymentMode', () => ({
    default: () => ({
        isPgOptionsLoading: false,
        isPgDown: false,
        availablePgOptions: { wallet: { available: true }, gateway: { available: true } },
    }),
}));

vi.mock('@routes/paths', () => ({
    paths: {
        companyIncorporation: { index: '/company-incorporation', payment: 'payment', tracking: 'tracking' },
        dashboard: { home: '/dashboard', payments: '/dashboard/payments' },
    },
}));

const mockState = (incorporation: any) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({
            reducer: {
                auth: { id: 7, role: 'corporate' },
                user: { user: { roleName: 'corporate' } },
                incorporation,
            },
        })
    );
};

describe('PaymentSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the payment breakdown and total for a submitted application', () => {
        mockState({
            submittedApplication: {
                applicationId: 'INC/2026/00001',
                totalAmount: 30000,
                mcaFilingFee: 5000,
                status: 'PENDING',
                createdAt: '2026-03-01T00:00:00Z',
            },
            currentApplication: { entityType: 'private_limited', capital: { authorizedCapital: 100000 } },
        });

        render(<PaymentSummary />);

        expect(screen.getByText('Payment Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Total Amount')).toBeInTheDocument();
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Wallet')).toBeInTheDocument();
    });

    it('shows the hydration skeleton when there is no submitted application', () => {
        mockState({ submittedApplication: null, currentApplication: {} });
        const { container } = render(<PaymentSummary />);
        expect(container.querySelector('.ant-skeleton')).toBeTruthy();
    });
});
