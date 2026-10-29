import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchLegalDocuments } from '../../api';
import useDocuments from '../../hooks/useDocuments';

vi.mock('../../api', () => ({
    fetchLegalDocuments: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
}));

vi.mock('react-svg', () => ({ ReactSVG: () => null }));

const mockApiDocs = [
    {
        id: 1,
        title: 'NDA Agreement',
        status: 'DRAFT',
        createdAt: '2024-01-15T10:00:00.000Z',
        legalTemplate: { category: 'Legal', iconKey: 'nda' },
    },
    {
        id: 2,
        title: 'Employment Contract',
        status: 'SENT',
        createdAt: '2024-02-20T10:00:00.000Z',
        legalTemplate: { category: 'HR', iconKey: 'employment' },
    },
    {
        id: 3,
        title: 'Shareholder Agreement',
        status: 'SIGNED',
        createdAt: '2024-03-10T10:00:00.000Z',
        legalTemplate: { category: 'Corporate', iconKey: 'shareholder' },
    },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useDocuments', () => {
    it('should fetch documents on mount and map to RecentDocument shape', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValueOnce({ data: mockApiDocs, count: 3 });

        const { result } = renderHook(() => useDocuments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.documents).toHaveLength(3);
        expect(result.current.documents[0]).toMatchObject({
            id: '1',
            title: 'NDA Agreement',
            status: 'Draft',
        });
        expect(result.current.documents[1].status).toBe('Sent');
        expect(result.current.documents[2].status).toBe('Signed');
        expect(result.current.total).toBe(3);
    });

    it('should set total from resp.count', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValueOnce({ data: mockApiDocs, count: 42 });

        const { result } = renderHook(() => useDocuments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.total).toBe(42);
    });

    it('should set documents to empty array when API returns false', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useDocuments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.documents).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('should forward limit, searchText, status filters to API', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValueOnce({ data: [], count: 0 });

        renderHook(() => useDocuments({ limit: 5, searchText: 'NDA', status: 'DRAFT' }));

        await waitFor(() => expect(fetchLegalDocuments).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 5, searchText: 'NDA', status: 'DRAFT' })
        ));
    });

    it('should re-fetch documents when reload is called', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValue({ data: [], count: 0 });

        const { result } = renderHook(() => useDocuments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            result.current.reload();
        });

        expect(fetchLegalDocuments).toHaveBeenCalledTimes(2);
    });

    it('should use DocAltIcon fallback when iconKey is unknown', async () => {
        (fetchLegalDocuments as Mock).mockResolvedValueOnce({
            data: [{ id: 1, title: 'Doc', status: 'DRAFT', createdAt: '2024-01-01', legalTemplate: { iconKey: 'unknown', category: '' } }],
            count: 1,
        });

        const { result } = renderHook(() => useDocuments());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.documents[0].iconSrc).toBeDefined();
    });
});
