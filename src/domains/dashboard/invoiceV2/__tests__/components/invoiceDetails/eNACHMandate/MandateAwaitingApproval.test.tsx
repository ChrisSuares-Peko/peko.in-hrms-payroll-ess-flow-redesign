import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MandateAwaitingApproval from '../../../../components/invoiceDetails/eNACHMandate/MandateAwaitingApproval';

const formValues: any = {
    customer: { name: 'Arshid', email: 'a@b.com', mobile: '9999' },
    mandate: { maxAmount: '5000', frequency: 'monthly', startDate: '2024-01-01' },
    purpose: { description: 'Loan EMI' },
};

describe('MandateAwaitingApproval', () => {
    it('renders header, customer details and authorization link', () => {
        render(
            <MandateAwaitingApproval
                authLink="https://link"
                formValues={formValues}
                onResend={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByText('Create eNACH Mandate')).toBeInTheDocument();
        expect(screen.getByText('Arshid')).toBeInTheDocument();
        expect(screen.getByText('Loan EMI')).toBeInTheDocument();
        expect(screen.getByText('https://link')).toBeInTheDocument();
        expect(screen.getByText('Awaiting customer approval')).toBeInTheDocument();
    });

    it('fires onResend and onCancel on action buttons', () => {
        const onResend = vi.fn();
        const onCancel = vi.fn();
        render(
            <MandateAwaitingApproval
                authLink="x"
                formValues={formValues}
                onResend={onResend}
                onCancel={onCancel}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: /Resend Authorization Link/i }));
        fireEvent.click(screen.getByRole('button', { name: /Cancel Mandate Setup/i }));
        expect(onResend).toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalled();
    });
});
