import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MandateForm from '../../../../components/invoiceDetails/eNACHMandate/MandateForm';

vi.mock('../../../../forms/invoiceDetails/ENACHMandateForms', () => ({
    CustomerDetailsForm: () => <div data-testid="customer-form" />,
    MandateConfigForm: () => <div data-testid="mandate-form" />,
    PurposeForm: () => <div data-testid="purpose-form" />,
}));

describe('MandateForm', () => {
    it('renders the three sub-forms and footer buttons', () => {
        render(<MandateForm initialValues={{}} onBack={vi.fn()} onSubmit={vi.fn()} />);
        expect(screen.getByText('Create eNACH Mandate')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form')).toBeInTheDocument();
        expect(screen.getByTestId('mandate-form')).toBeInTheDocument();
        expect(screen.getByTestId('purpose-form')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Proceed to Customer Authorisation/i })
        ).toBeInTheDocument();
    });

    it('calls onBack when Cancel is clicked', () => {
        const onBack = vi.fn();
        render(<MandateForm initialValues={{}} onBack={onBack} onSubmit={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onBack).toHaveBeenCalled();
    });
});
