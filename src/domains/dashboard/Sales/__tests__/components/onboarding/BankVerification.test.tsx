import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import BankVerification from '../../../components/onboarding/BankVerification';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../forms/onboarding/BankVerificationForm', () => ({
    default: () => <div data-testid="bank-form" />,
}));

describe('BankVerification', () => {
    it('renders the verification form when verifiedBankData is null', () => {
        render(
            <BankVerification
                initialValues={
                    { accountNumber: '', ifsc: '', accountHolderName: '' } as any
                }
                verifiedBankData={null}
                onSubmit={async () => {}}
                onChange={() => {}}
            />
        );

        expect(screen.getByText('Verify Bank Account')).toBeInTheDocument();
        expect(screen.getByTestId('bank-form')).toBeInTheDocument();
        expect(screen.getByText(/why is bank verification required/i)).toBeInTheDocument();
    });

    it('renders verified info rows when verifiedBankData is provided', () => {
        const verified = {
            accountNumber: '1234567890',
            ifsc: 'HDFC0001234',
            accountHolderName: 'John Doe',
        };

        render(
            <BankVerification
                initialValues={
                    { accountNumber: '', ifsc: '', accountHolderName: '' } as any
                }
                verifiedBankData={verified as any}
                onSubmit={async () => {}}
                onChange={() => {}}
            />
        );

        expect(screen.getByText('Bank Account Verified Successfully')).toBeInTheDocument();
        expect(screen.queryByTestId('bank-form')).not.toBeInTheDocument();
        expect(screen.getByText('HDFC0001234')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        // accountNumber should be masked.
        expect(screen.queryByText('1234567890')).not.toBeInTheDocument();
    });
});
