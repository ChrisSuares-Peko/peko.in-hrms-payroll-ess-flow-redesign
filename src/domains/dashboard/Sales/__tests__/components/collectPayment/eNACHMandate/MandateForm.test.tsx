import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

import MandateForm from '../../../../components/collectPayment/eNACHMandate/MandateForm';

vi.mock('../../../../forms/collectPayment/ENACHMandateForms', () => ({
    CustomerDetailsForm: () => <div data-testid="customer-form" />,
    MandateConfigForm: () => <div data-testid="mandate-form" />,
    PurposeForm: () => <div data-testid="purpose-form" />,
}));
vi.mock('../../../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

describe('MandateForm', () => {
    it('renders the three sub-forms and Cancel/Proceed buttons', () => {
        render(
            <MandateForm
                initialValues={{ name: 'A', email: 'a@b.com', mobile: '999' }}
                onBack={() => {}}
                onSubmit={async () => {}}
            />
        );

        expect(screen.getByText('Create eNACH Mandate')).toBeInTheDocument();
        expect(screen.getByTestId('customer-form')).toBeInTheDocument();
        expect(screen.getByTestId('mandate-form')).toBeInTheDocument();
        expect(screen.getByTestId('purpose-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /proceed to customer authorisation/i })
        ).toBeInTheDocument();
    });

    it('triggers onBack when Cancel clicked', () => {
        const onBack = vi.fn();
        render(
            <MandateForm
                initialValues={{}}
                onBack={onBack}
                onSubmit={async () => {}}
            />
        );

        screen.getByRole('button', { name: /^cancel$/i }).click();
        expect(onBack).toHaveBeenCalled();
    });
});
