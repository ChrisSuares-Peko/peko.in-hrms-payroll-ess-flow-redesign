import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BankVerification from '../../../components/onboarding/BankVerification';

vi.mock('../../../forms/onboarding/BankVerificationForm', () => ({
    default: () => <div data-testid="bv-form" />,
}));

vi.mock('../../../constants/onboarding', () => ({
    BANK_VERIFICATION_INFO_ROWS: [
        { label: 'Name', key: 'accountHolderName' },
        { label: 'Account', key: 'accountNumber' },
    ],
}));

const initialValues = { accountNumber: '', ifsc: '', name: '', phone: '' } as any;

describe('BankVerification', () => {
    it('renders the form when no verified data', () => {
        render(
            <BankVerification
                initialValues={initialValues}
                verifiedBankData={null}
                onSubmit={vi.fn()}
                onChange={vi.fn()}
            />
        );
        expect(screen.getByText('Verify Bank Account')).toBeInTheDocument();
        expect(screen.getByTestId('bv-form')).toBeInTheDocument();
    });

    it('renders the verified summary when verifiedBankData present', () => {
        render(
            <BankVerification
                initialValues={initialValues}
                verifiedBankData={
                    {
                        accountHolderName: 'Arshid',
                        accountNumber: '12345678',
                        ifsc: 'IFSC0001',
                        bankName: 'HDFC',
                        phone: '999',
                    } as any
                }
                onSubmit={vi.fn()}
                onChange={vi.fn()}
            />
        );
        expect(screen.getByText('Bank Account Verified Successfully')).toBeInTheDocument();
        expect(screen.getByText('Arshid')).toBeInTheDocument();
    });
});
