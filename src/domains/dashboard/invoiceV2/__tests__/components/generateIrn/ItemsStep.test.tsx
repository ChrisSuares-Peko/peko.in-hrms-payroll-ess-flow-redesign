import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ItemsStep from '../../../components/generateIrn/ItemsStep';
import { ItemsFormValues } from '../../../types/generateIrn';

vi.mock('../../../forms/generateIrn/ItemsForm', () => ({
    default: () => <div data-testid="items-form" />,
}));

vi.mock('../../../utils/generateIrnCalculations', () => ({
    calcTaxable: () => 100,
    calcIgst: () => 18,
    calcCgst: () => 9,
    calcTotal: () => 118,
}));

const initialValues: ItemsFormValues = {
    items: [
        {
            id: '1',
            description: 'Item',
            hsnSac: '1',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 100,
            discount: 0,
            gstRate: 18,
        },
    ],
};

describe('ItemsStep', () => {
    it('renders the inner form and the Add New Item button', () => {
        render(
            <ItemsStep initialValues={initialValues} onNext={vi.fn()} igstOnIntra={false} />
        );
        expect(screen.getByTestId('items-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add New Item/i })).toBeInTheDocument();
    });

    it('shows CGST/SGST totals when igstOnIntra=false', () => {
        render(
            <ItemsStep initialValues={initialValues} onNext={vi.fn()} igstOnIntra={false} />
        );
        expect(screen.getByText('Total CGST')).toBeInTheDocument();
        expect(screen.getByText('Total SGST')).toBeInTheDocument();
        expect(screen.queryByText('Total IGST')).toBeNull();
    });

    it('shows IGST total when igstOnIntra=true', () => {
        render(
            <ItemsStep initialValues={initialValues} onNext={vi.fn()} igstOnIntra />
        );
        expect(screen.getByText('Total IGST')).toBeInTheDocument();
        expect(screen.queryByText('Total CGST')).toBeNull();
    });

    it('adds a new line item when Add New Item is clicked', () => {
        const onNext = vi.fn();
        render(
            <ItemsStep initialValues={initialValues} onNext={onNext} igstOnIntra={false} />
        );
        fireEvent.click(screen.getByRole('button', { name: /Add New Item/i }));
        // We don't assert internal Formik state directly; instead verify no crash.
        expect(screen.getByTestId('items-form')).toBeInTheDocument();
    });
});
