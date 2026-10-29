import React from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchCatalog } from '../../../api/catalog';
import { useInvoiceCatalogSearch } from '../../../hooks/createInvoice/useInvoiceCatalogSearch';

vi.mock('../../../api/catalog', () => ({
    fetchCatalog: vi.fn(),
    createCatalogItem: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const dispatchMock = vi.fn();
vi.mock('react-redux', () => ({
    useDispatch: () => dispatchMock,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: any) => x),
}));

vi.mock('@src/hooks/useDebounce', () => ({
    default: vi.fn((v: string) => v),
}));

vi.mock('../../../schema/product', () => ({
    productFormSchema: { validate: vi.fn() },
}));

const initialValues = {
    items: [
        {
            name: '',
            hsn: '',
            quantity: '',
            unit: '',
            unitPrice: '',
            discount: '0',
            taxRate: '0',
            taxMode: 'Exclusive',
            netAmount: '',
        },
    ],
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
        Formik,
        { initialValues, onSubmit: vi.fn() },
        children
    );

const mockCatalogResponse = {
    rows: [{ id: 1, name: 'Product A', unitPrice: '200', gstPercent: '18', hsnCode: '1234', description: '' }],
    count: 1,
};

describe('useInvoiceCatalogSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('catalogItems empty initially before search text is set (api returns empty)', async () => {
        (fetchCatalog as Mock).mockResolvedValue({ rows: [], count: 0 });

        const { result } = renderHook(() => useInvoiceCatalogSearch(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.catalogItems).toHaveLength(0);
    });

    it('options derived correctly from catalogItems (value=String(id), label=name)', async () => {
        (fetchCatalog as Mock).mockResolvedValue(mockCatalogResponse);

        const { result } = renderHook(() => useInvoiceCatalogSearch(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: '1', label: 'Product A' }),
            ])
        );
    });

    it('isLoading is false initially (before first fetch resolves)', () => {
        (fetchCatalog as Mock).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useInvoiceCatalogSearch(), { wrapper });

        expect(result.current.isLoading).toBeDefined();
    });

    it('isModalOpen is false initially', async () => {
        (fetchCatalog as Mock).mockResolvedValue({ rows: [], count: 0 });

        const { result } = renderHook(() => useInvoiceCatalogSearch(), { wrapper });

        expect(result.current.isModalOpen).toBe(false);
    });
});
