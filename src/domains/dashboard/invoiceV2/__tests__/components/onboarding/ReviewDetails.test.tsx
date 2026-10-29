import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ReviewDetails from '../../../components/onboarding/ReviewDetails';

vi.mock('../../../forms/onboarding/BankAccountForm', () => ({
    default: () => <div data-testid="bank-account-form" />,
}));

const data: any = {
    businessName: 'Acme',
    bankName: 'HDFC',
    accountNumber: '1234567890',
    ifsc: 'IFSC0001',
};

describe('ReviewDetails', () => {
    it('renders business name and bank account info in read-only mode', () => {
        render(
            <ReviewDetails
                data={data}
                isEditingBank={false}
                onEditBank={vi.fn()}
                onSaveBank={vi.fn()}
                onCancelEditBank={vi.fn()}
                onSaveBusiness={vi.fn()}
            />
        );
        expect(screen.getByText('Review Business Details')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText(/HDFC - 1234567890/)).toBeInTheDocument();
        expect(screen.getByText(/IFSC: IFSC0001/)).toBeInTheDocument();
    });

    it('renders BankAccountForm when isEditingBank is true', () => {
        render(
            <ReviewDetails
                data={data}
                isEditingBank
                onEditBank={vi.fn()}
                onSaveBank={vi.fn()}
                onCancelEditBank={vi.fn()}
                onSaveBusiness={vi.fn()}
            />
        );
        expect(screen.getByTestId('bank-account-form')).toBeInTheDocument();
    });

    it('starts in edit mode when businessName is empty', () => {
        render(
            <ReviewDetails
                data={{ ...data, businessName: '' }}
                isEditingBank={false}
                onEditBank={vi.fn()}
                onSaveBank={vi.fn()}
                onCancelEditBank={vi.fn()}
                onSaveBusiness={vi.fn()}
            />
        );
        expect(screen.getByPlaceholderText('Enter business name')).toBeInTheDocument();
    });

    it('fires onCancelEditBank when Cancel is clicked in bank edit mode', () => {
        const onCancelEditBank = vi.fn();
        render(
            <ReviewDetails
                data={data}
                isEditingBank
                onEditBank={vi.fn()}
                onSaveBank={vi.fn()}
                onCancelEditBank={onCancelEditBank}
                onSaveBusiness={vi.fn()}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancelEditBank).toHaveBeenCalled();
    });
});
