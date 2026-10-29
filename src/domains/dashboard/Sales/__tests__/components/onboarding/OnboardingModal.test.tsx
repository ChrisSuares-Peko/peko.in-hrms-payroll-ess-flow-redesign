import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import OnboardingModal from '../../../components/onboarding/OnboardingModal';
import useOnboarding from '../../../hooks/useOnboarding';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: () => mockDispatch }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../hooks/useOnboarding', () => ({ default: vi.fn() }));

vi.mock('../../../components/onboarding/GetStarted', () => ({
    default: ({ onNext }: any) => (
        <button type="button" onClick={onNext}>
            get-started-next
        </button>
    ),
}));
vi.mock('../../../components/onboarding/ReviewDetails', () => ({
    default: ({ onSaveBank, onSaveBusiness }: any) => (
        <div>
            <button type="button" onClick={() => onSaveBusiness('Acme Co')}>
                save-business
            </button>
            <button
                type="button"
                onClick={() =>
                    onSaveBank({ bankName: 'HDFC', accountNumber: '1234', ifsc: 'HDFC0001234' })
                }
            >
                save-bank
            </button>
        </div>
    ),
}));
vi.mock('../../../components/onboarding/PANVerification', () => ({
    default: ({ onChange, onVerify, verifiedPan }: any) => (
        <div>
            {!verifiedPan ? (
                <>
                    <span data-testid="pan-step">pan-step</span>
                    <button type="button" onClick={() => onChange('ABCDE1234F')}>
                        set-pan
                    </button>
                    <button type="button" onClick={onVerify}>
                        verify-pan
                    </button>
                </>
            ) : (
                <span data-testid="pan-verified">pan-verified</span>
            )}
        </div>
    ),
}));
vi.mock('../../../components/onboarding/BankVerification', async () => {
    const { forwardRef, useImperativeHandle } = await import('react');
    return {
        default: forwardRef(({ onSubmit, verifiedBankData }: any, ref: any) => {
            useImperativeHandle(ref, () => ({
                submitForm: () =>
                    onSubmit({
                        accountNumber: '1234567890',
                        ifsc: 'HDFC0001234',
                        name: 'Test User',
                        phone: '9999999999',
                    }),
            }));
            return (
                <div>
                    <span data-testid="bank-verification-step">bank-verification-step</span>
                    {verifiedBankData && (
                        <span data-testid="bank-verified">bank-verified</span>
                    )}
                </div>
            );
        }),
    };
});
vi.mock('../../../components/onboarding/ConsentConfirm', () => ({
    default: ({ onConsentChange, consent }: any) => (
        <div>
            <span>consent-step</span>
            <button type="button" onClick={() => onConsentChange(!consent)}>
                toggle-consent
            </button>
        </div>
    ),
}));
vi.mock('../../../components/onboarding/ActivationSuccess', () => ({
    default: ({ onDone, virtualAccount }: any) => (
        <div>
            <span>activation-success</span>
            <span>{virtualAccount}</span>
            <button type="button" onClick={onDone}>
                continue
            </button>
        </div>
    ),
}));
vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

const saveStep1 = vi.fn();
const activateNow = vi.fn();
const savePanStep = vi.fn();
const saveBankStep = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useOnboarding as any).mockReturnValue({
        isSavingStep1: false,
        isSavingPan: false,
        isSavingBank: false,
        isActivating: false,
        saveStep1,
        savePanStep,
        saveBankStep,
        activateNow,
    });
    saveStep1.mockResolvedValue(true);
    savePanStep.mockResolvedValue('9999999999');
    saveBankStep.mockResolvedValue({
        bankName: 'HDFC',
        accountNumber: '1234567890',
        ifsc: 'HDFC0001234',
        accountHolderName: 'Test User',
        phone: '9999999999',
    });
    activateNow.mockResolvedValue(null);
});

const navigateToConsent = async () => {
    fireEvent.click(screen.getByText('get-started-next'));
    fireEvent.click(screen.getByText('save-business'));
    fireEvent.click(screen.getByText('save-bank'));
    fireEvent.click(screen.getByText('Continue').closest('button') as HTMLElement);
    await waitFor(() => screen.getByTestId('pan-step'));
    fireEvent.click(screen.getByText('set-pan'));
    fireEvent.click(screen.getByText('verify-pan'));
    await waitFor(() => screen.getByTestId('pan-verified'));
    fireEvent.click(screen.getByText('Continue').closest('button') as HTMLElement);
    await waitFor(() => screen.getByTestId('bank-verification-step'));
    fireEvent.click(screen.getByText('Continue').closest('button') as HTMLElement);
    await waitFor(() => screen.getByTestId('bank-verified'));
    fireEvent.click(screen.getByText('Continue').closest('button') as HTMLElement);
    await waitFor(() => screen.getByText('consent-step'));
};

describe('OnboardingModal', () => {
    it('starts on the GetStarted step', () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        expect(screen.getByText('get-started-next')).toBeInTheDocument();
    });

    it('moves to the Review step when GetStarted next is clicked', () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        fireEvent.click(screen.getByText('get-started-next'));

        expect(screen.getByText('Activate Payment Collections')).toBeInTheDocument();
        expect(screen.getByText('save-business')).toBeInTheDocument();
        expect((screen.getByText('Continue').closest('button') as HTMLElement)).toBeInTheDocument();
    });

    it('shows error toast when Continue clicked without business name', () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        fireEvent.click(screen.getByText('get-started-next'));
        fireEvent.click((screen.getByText('Continue').closest('button') as HTMLElement));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Business name is required.',
            variant: 'error',
        });
    });

    it('shows bank-details error when business name is filled but bank fields are missing', () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        fireEvent.click(screen.getByText('get-started-next'));
        fireEvent.click(screen.getByText('save-business'));
        fireEvent.click((screen.getByText('Continue').closest('button') as HTMLElement));

        expect(showToast).toHaveBeenCalledWith({
            description: 'Please fill in all bank account details.',
            variant: 'error',
        });
    });

    it('advances to consent step after saveStep1 succeeds', async () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        await navigateToConsent();

        expect(saveStep1).toHaveBeenCalled();
        expect(screen.getByText('consent-step')).toBeInTheDocument();
    });

    it('Activate Now is disabled until consent is checked', async () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        await navigateToConsent();

        const activateBtn = screen.getByText('Activate Now').closest('button') as HTMLElement;
        expect(activateBtn).toBeDisabled();

        fireEvent.click(screen.getByText('toggle-consent'));
        expect(screen.getByText('Activate Now').closest('button')).toBeEnabled();
    });

    it('moves to success step when Activate Now succeeds', async () => {
        activateNow.mockResolvedValueOnce('VA-9999');

        render(<OnboardingModal open onCancel={() => {}} />);

        await navigateToConsent();

        fireEvent.click(screen.getByText('toggle-consent'));
        fireEvent.click(screen.getByText('Activate Now').closest('button') as HTMLElement);

        await waitFor(() => {
            expect(screen.getByText('activation-success')).toBeInTheDocument();
            expect(screen.getByText('VA-9999')).toBeInTheDocument();
        });
    });

    it('Back button on consent step returns to bank-verification', async () => {
        render(<OnboardingModal open onCancel={() => {}} />);

        await navigateToConsent();

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(screen.queryByText('consent-step')).not.toBeInTheDocument();
        expect(screen.getByTestId('bank-verification-step')).toBeInTheDocument();
    });

    it('Cancel button on review step calls onCancel', () => {
        const onCancel = vi.fn();
        render(<OnboardingModal open onCancel={onCancel} />);

        fireEvent.click(screen.getByText('get-started-next'));
        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

        expect(onCancel).toHaveBeenCalled();
    });

    it('Continue on success step calls onSuccess and onCancel', async () => {
        activateNow.mockResolvedValueOnce('VA-1');
        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        render(<OnboardingModal open onCancel={onCancel} onSuccess={onSuccess} />);

        await navigateToConsent();
        fireEvent.click(screen.getByText('toggle-consent'));
        fireEvent.click(screen.getByText('Activate Now').closest('button') as HTMLElement);
        await waitFor(() => screen.getByText('activation-success'));

        fireEvent.click(screen.getByText('continue'));

        expect(onSuccess).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });
});
