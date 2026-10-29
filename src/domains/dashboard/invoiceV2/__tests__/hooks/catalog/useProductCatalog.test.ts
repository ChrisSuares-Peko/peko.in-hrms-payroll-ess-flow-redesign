import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchCatalog } from '../../../api/catalog';
import { useProductCatalog } from '../../../hooks/catalog/useProductCatalog';

vi.mock('../../../api/catalog', () => ({
    fetchCatalog: vi.fn(),
    createCatalogItem: vi.fn(),
    updateCatalogItem: vi.fn(),
    deleteCatalogItem: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

vi.mock('../../../hooks/useDebounceSearch', () => ({
    default: vi.fn(() => ({ search: '', updateSearchText: vi.fn() })),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('react-redux', () => ({
    useDispatch: () => dispatchMock,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: any) => x),
}));

vi.mock('../../../schema/product', () => ({
    productFormSchema: { validate: vi.fn() },
}));

const mockCatalogResponse = {
    rows: [{ id: 1, name: 'Item A', unitPrice: '100', gstPercent: '18', hsnCode: '1234', description: '' }],
    count: 1,
};

describe('useProductCatalog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches catalog on mount and sets items and total', async () => {
        (fetchCatalog as Mock).mockResolvedValue(mockCatalogResponse);

        const { result } = renderHook(() => useProductCatalog());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(fetchCatalog).toHaveBeenCalled();
        expect(result.current.items).toHaveLength(1);
        expect(result.current.total).toBe(1);
    });

    it('isLoading becomes false after fetch', async () => {
        (fetchCatalog as Mock).mockResolvedValue(mockCatalogResponse);

        const { result } = renderHook(() => useProductCatalog());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isLoading).toBe(false);
    });

    it('isModalOpen is false initially', async () => {
        (fetchCatalog as Mock).mockResolvedValue(mockCatalogResponse);

        const { result } = renderHook(() => useProductCatalog());

        expect(result.current.isModalOpen).toBe(false);
    });

    it('handleOpenAdd sets isModalOpen to true', async () => {
        (fetchCatalog as Mock).mockResolvedValue(mockCatalogResponse);

        const { result } = renderHook(() => useProductCatalog());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handleOpenAdd();
        });

        expect(result.current.isModalOpen).toBe(true);
    });

    it('returns empty items when api returns null', async () => {
        (fetchCatalog as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useProductCatalog());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.items).toHaveLength(0);
    });
});
