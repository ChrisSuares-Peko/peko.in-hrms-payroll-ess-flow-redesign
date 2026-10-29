import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import ItemsTable from '../../../components/createDocument/ItemsTable';

vi.mock('../../../hooks/useCatalogSearch', () => ({
    useCatalogSearch: () => ({
        catalogItems: [],
        isLoading: false,
        setSearchText: vi.fn(),
        isModalOpen: false,
        isSubmitting: false,
        catalogFormik: {
            values: { name: '', description: '', hsnCode: '', unitPrice: 0, gstRate: '5' },
            touched: {},
            errors: {},
            setFieldValue: vi.fn(),
            handleSubmit: vi.fn(),
        },
        handleOpenAddModal: vi.fn(),
        handleClose: vi.fn(),
        handleModalSubmit: vi.fn(),
    }),
}));

const renderWithFormik = (initialValues: any) =>
    render(
        <Formik initialValues={initialValues} onSubmit={() => {}}>
            <ItemsTable />
        </Formik>
    );

const baseItem = {
    name: 'Item',
    hsn: '',
    quantity: '1',
    unit: 'pcs',
    unitPrice: '100',
    discount: '0',
    taxRate: '0',
    netAmount: '',
};

// The Title cell is now an antd AutoComplete (role="combobox"); Unit/Tax Rate cells are
// non-searchable Selects rendered as read-only comboboxes, so filtering those out isolates
// the item-name autocomplete input for each row.
const getItemNameInputs = () =>
    screen.getAllByRole('combobox').filter(el => !el.hasAttribute('readonly'));

describe('ItemsTable', () => {
    it('renders the Items header and Add Item button', () => {
        renderWithFormik({ items: [baseItem] });

        expect(screen.getByText('Items')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    // These two render two AutoComplete-backed rows (vs. one for the other tests above/below),
    // which is measurably slower under jsdom's synchronous getComputedStyle fallback used by
    // antd's Table/resize-observer wiring — bump the timeout so it isn't flaky on slower CI runners.
    it(
        'renders one row per item',
        () => {
            renderWithFormik({
                items: [
                    { ...baseItem, name: 'Row 1' },
                    { ...baseItem, name: 'Row 2' },
                ],
            });

            const inputs = getItemNameInputs();
            expect(inputs).toHaveLength(2);
            expect((inputs[0] as HTMLInputElement).value).toBe('Row 1');
            expect((inputs[1] as HTMLInputElement).value).toBe('Row 2');
        },
        15000
    );

    it(
        'appends a new empty row when Add Item is clicked',
        () => {
            renderWithFormik({ items: [{ ...baseItem, name: 'A' }] });

            fireEvent.click(screen.getByRole('button', { name: /add item/i }));

            const inputs = getItemNameInputs();
            expect(inputs).toHaveLength(2);
            expect((inputs[1] as HTMLInputElement).value).toBe('');
        },
        15000
    );

    it(
        'renders the column headers',
        () => {
            renderWithFormik({ items: [baseItem] });

            // Column headers render as <th role="columnheader"> via antd Table.
            const headers = screen
                .getAllByRole('columnheader')
                .map(el => el.textContent?.trim() ?? '');
            expect(headers).toContain('Title');
            expect(headers).toContain('Quantity');
            expect(headers).toContain('Unit Price (₹)');
        },
        15000
    );
});
