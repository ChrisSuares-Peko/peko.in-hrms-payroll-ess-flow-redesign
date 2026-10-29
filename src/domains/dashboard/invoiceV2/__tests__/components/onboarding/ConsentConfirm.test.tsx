import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ConsentConfirm from '../../../components/onboarding/ConsentConfirm';

vi.mock('../../../constants/invoiceDetails', () => ({
    CURRENCY_ACCOUNT_SETTLEMENT_NOTES: ['Settled to bank in T+1', 'Charges as per plan'],
}));

const data: any = {
    businessName: 'Acme',
    bankName: 'HDFC',
    accountNumber: '1234',
    ifsc: 'IFSC0001',
};

describe('ConsentConfirm', () => {
    it('renders business and bank details', () => {
        render(<ConsentConfirm data={data} consent={false} onConsentChange={vi.fn()} />);
        expect(screen.getByText('Consent and Confirmation')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
        expect(screen.getByText('HDFC - 1234')).toBeInTheDocument();
        expect(screen.getByText('IFSC0001')).toBeInTheDocument();
    });

    it('toggles consent when checkbox is clicked', () => {
        const onConsentChange = vi.fn();
        render(<ConsentConfirm data={data} consent={false} onConsentChange={onConsentChange} />);
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(onConsentChange).toHaveBeenCalledWith(true);
    });
});
