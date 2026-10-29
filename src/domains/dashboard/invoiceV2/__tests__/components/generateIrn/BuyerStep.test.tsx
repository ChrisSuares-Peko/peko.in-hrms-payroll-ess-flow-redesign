import { createRef } from 'react';

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BuyerStep from '../../../components/generateIrn/BuyerStep';
import { defaultBuyerValues } from '../../../constants/generateIrn';
import { CustomerOption } from '../../../types/createInvoice';
import { StepHandle } from '../../../types/generateIrn';

vi.mock('../../../forms/generateIrn/BuyerForm', () => ({
    default: ({ customers }: any) => (
        <div data-testid="buyer-form" data-count={customers.length} />
    ),
}));

const validBuyer = {
    ...defaultBuyerValues,
    buyerGstin: '29ABCDE1234F1Z5',
    legalName: 'Buyer Pvt Ltd',
    tradeName: 'Buyer',
    phoneNumber: '9999999999',
    address1: 'Main Street',
    location: 'Bengaluru',
    pinCode: '560001',
    state: 'Karnataka',
    placeOfSupply: 'Karnataka',
};

const mockCustomers: CustomerOption[] = [
    { id: 1, name: 'Acme' } as CustomerOption,
    { id: 2, name: 'Beta' } as CustomerOption,
];

const defaultProps = {
    stateOptions: [],
    isLoadingStates: false,
    customers: [],
    isLoadingCustomers: false,
};

describe('BuyerStep', () => {
    it('forwards customers prop to the form', () => {
        render(
            <BuyerStep
                {...defaultProps}
                customers={mockCustomers}
                initialValues={validBuyer}
                onNext={vi.fn()}
            />
        );
        const form = screen.getByTestId('buyer-form');
        expect(form.dataset.count).toBe('2');
    });

    it('renders with empty customer list', () => {
        render(
            <BuyerStep
                {...defaultProps}
                initialValues={validBuyer}
                onNext={vi.fn()}
            />
        );
        const form = screen.getByTestId('buyer-form');
        expect(form.dataset.count).toBe('0');
    });

    it('invokes onNext on imperative submit', async () => {
        const onNext = vi.fn();
        const ref = createRef<StepHandle>();
        render(
            <BuyerStep
                {...defaultProps}
                ref={ref}
                initialValues={validBuyer}
                onNext={onNext}
            />
        );
        await screen.findByTestId('buyer-form');
        await act(async () => {
            await ref.current?.submit();
        });
        expect(onNext).toHaveBeenCalled();
        expect(onNext.mock.calls[0][0]).toEqual(expect.objectContaining(validBuyer));
    });
});
