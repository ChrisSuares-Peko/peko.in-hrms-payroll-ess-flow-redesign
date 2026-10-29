import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OnboardingModal from '../../../components/onboarding/OnboardingModal';

vi.mock('../../../hooks/useOnboarding', () => ({
    default: () => ({
        isSavingStep1: false,
        isSavingPan: false,
        isSavingBank: false,
        isActivating: false,
        saveStep1: vi.fn(),
        savePanStep: vi.fn(),
        saveBankStep: vi.fn(),
        verifyBankStep: vi.fn(),
        activateNow: vi.fn(),
    }),
}));

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('../../../constants/onboarding', () => ({
    BACK_STEP: {
        review: 'get-started',
        pan: 'review',
        'bank-verification': 'pan',
        consent: 'bank-verification',
    },
    DEFAULT_BANK_VERIFICATION_VALUES: { accountNumber: '', ifsc: '', name: '', phone: '' },
    DEFAULT_CURRENCY_ACCOUNT_BUSINESS: {
        businessName: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
    },
    STEP_LABELS: { review: 'Review', pan: 'PAN', 'bank-verification': 'Bank', consent: 'Consent' },
    STEP_ORDER: ['review', 'pan', 'bank-verification', 'consent'],
    BANK_VERIFICATION_INFO_ROWS: [],
}));

vi.mock('../../../components/onboarding/GetStarted', () => ({
    default: ({ onNext }: any) => (
        <button type="button" data-testid="get-started" onClick={onNext}>
            Get Started
        </button>
    ),
}));

vi.mock('../../../components/onboarding/ReviewDetails', () => ({
    default: () => <div data-testid="review" />,
}));

vi.mock('../../../components/onboarding/PANVerification', () => ({
    default: () => <div data-testid="pan-step" />,
}));

vi.mock('../../../components/onboarding/BankVerification', () => ({
    default: () => <div data-testid="bank-step" />,
}));

vi.mock('../../../components/onboarding/ConsentConfirm', () => ({
    default: () => <div data-testid="consent-step" />,
}));

vi.mock('../../../components/onboarding/ActivationSuccess', () => ({
    default: () => <div data-testid="success-step" />,
}));

describe('OnboardingModal', () => {
    it('renders GetStarted on initial step when open', () => {
        render(<OnboardingModal open onCancel={vi.fn()} />);
        expect(screen.getByTestId('get-started')).toBeInTheDocument();
    });

    it('moves into review step when GetStarted is clicked', () => {
        render(<OnboardingModal open onCancel={vi.fn()} />);
        fireEvent.click(screen.getByTestId('get-started'));
        expect(screen.getByTestId('review')).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
        render(<OnboardingModal open={false} onCancel={vi.fn()} />);
        expect(screen.queryByTestId('get-started')).not.toBeInTheDocument();
    });
});
