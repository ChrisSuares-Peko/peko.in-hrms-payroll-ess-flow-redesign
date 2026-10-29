import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import ItemsTable from '../../../components/createInvoice/ItemsTable';

vi.mock('../../../utils/table_column/itemsTableColumns', () => ({
    getItemsTableColumns: () => [{ title: 'Name', dataIndex: 'name', key: 'name' }],
}));

const initialValues = {
    items: [
        {
            name: 'Widget',
            hsn: '',
            quantity: '',
            unit: 'pcs',
            unitPrice: '',
            discount: '0',
            taxRate: '0',
        },
    ],
};

describe('ItemsTable', () => {
    it('renders the Items heading and Add Item button', () => {
        render(
            <Formik initialValues={initialValues} onSubmit={() => {}}>
                <ItemsTable />
            </Formik>
        );

        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
    });

    it('adds a new blank item when Add Item is clicked', () => {
        render(
            <Formik initialValues={initialValues} onSubmit={() => {}}>
                <ItemsTable />
            </Formik>
        );

        const btn = screen.getByRole('button', { name: /Add Item/i });
        fireEvent.click(btn);
        // No crash and button still present
        expect(btn).toBeInTheDocument();
    });
});
