import { createRef } from 'react';

import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TransactionStep from '../../../components/generateIrn/TransactionStep';
import { defaultTransactionValues } from '../../../constants/generateIrn';
import { StepHandle, TransactionFormValues } from '../../../types/generateIrn';

const valid: TransactionFormValues = {
    ...defaultTransactionValues,
    documentNumber: '001',
};

vi.mock('../../../forms/generateIrn/TransactionForm', () => ({
    default: ({ nextNumber }: any) => (
        <div data-testid="transaction-form" data-next={nextNumber} />
    ),
}));

describe('TransactionStep', () => {
    it('renders the inner form and forwards nextNumber', () => {
        render(
            <TransactionStep
                initialValues={defaultTransactionValues}
                prefixMap={{ INV: 'INV' }}
                nextNumber="42"
                onNext={vi.fn()}
            />
        );
        const form = screen.getByTestId('transaction-form');
        expect(form).toBeInTheDocument();
        expect(form.dataset.next).toBe('42');
    });

    it('calls onNext when the imperative submit handle is invoked', async () => {
        const onNext = vi.fn();
        const ref = createRef<StepHandle>();
        render(
            <TransactionStep
                ref={ref}
                initialValues={valid}
                prefixMap={{ INV: 'INV' }}
                nextNumber="1"
                onNext={onNext}
            />
        );
        await act(async () => {
            await ref.current?.submit();
        });
        expect(onNext).toHaveBeenCalled();
        expect(onNext.mock.calls[0][0]).toEqual(expect.objectContaining(valid));
    });
});
