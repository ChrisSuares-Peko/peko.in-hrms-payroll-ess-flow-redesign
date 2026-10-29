import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import ReviewDetails from '../../../components/onboarding/ReviewDetails';

vi.mock('../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../forms/onboarding/BankAccountForm', () => ({
    default: () => <div data-testid="bank-account-form" />,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('ReviewDetails', () => {
    const baseData = {
        businessName: 'Acme Corp',
        bankName: 'HDFC',
        accountNumber: '1234567890',
        ifsc: 'HDFC0001234',
    };

    it('shows business name and bank summary when not editing', () => {
        render(
            <ReviewDetails
                data={baseData as any}
                isEditingBank={false}
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={() => {}}
                onSaveBusiness={() => {}}
            />
        );

        expect(screen.getByText('Review Business Details')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.getByText('HDFC - 1234567890')).toBeInTheDocument();
        expect(screen.getByText('IFSC: HDFC0001234')).toBeInTheDocument();
    });

    it('shows business name input when edit button is clicked', () => {
        render(
            <ReviewDetails
                data={{ ...baseData, businessName: '' } as any}
                isEditingBank={false}
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={() => {}}
                onSaveBusiness={() => {}}
            />
        );

        // Two edit buttons: first is business name, second is bank account
        fireEvent.click(screen.getAllByRole('button')[0]);
        expect(screen.getByPlaceholderText(/enter business name/i)).toBeInTheDocument();
    });

    it('shows validation error when business name is too short', () => {
        const onSaveBusiness = vi.fn();
        render(
            <ReviewDetails
                data={{ ...baseData, businessName: '' } as any}
                isEditingBank={false}
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={() => {}}
                onSaveBusiness={onSaveBusiness}
            />
        );

        fireEvent.click(screen.getAllByRole('button')[0]);
        const input = screen.getByPlaceholderText(/enter business name/i);
        fireEvent.change(input, { target: { value: 'AB' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
        expect(onSaveBusiness).not.toHaveBeenCalled();
    });

    it('saves business name when valid input is provided', () => {
        const onSaveBusiness = vi.fn();
        render(
            <ReviewDetails
                data={{ ...baseData, businessName: '' } as any}
                isEditingBank={false}
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={() => {}}
                onSaveBusiness={onSaveBusiness}
            />
        );

        fireEvent.click(screen.getAllByRole('button')[0]);
        const input = screen.getByPlaceholderText(/enter business name/i);
        fireEvent.change(input, { target: { value: 'New Name' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        expect(onSaveBusiness).toHaveBeenCalledWith('New Name');
    });

    it('renders BankAccountForm when isEditingBank is true', () => {
        render(
            <ReviewDetails
                data={baseData as any}
                isEditingBank
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={() => {}}
                onSaveBusiness={() => {}}
            />
        );

        expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
    });

    it('triggers onCancelEditBank when Cancel is clicked in bank edit', () => {
        const onCancelEditBank = vi.fn();
        render(
            <ReviewDetails
                data={baseData as any}
                isEditingBank
                onEditBank={() => {}}
                onSaveBank={async () => {}}
                onCancelEditBank={onCancelEditBank}
                onSaveBusiness={() => {}}
            />
        );

        // Multiple Cancel buttons may exist; find via the bank form's footer (the only one rendered here is bank since business is not editing).
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancelEditBank).toHaveBeenCalled();
    });
});
