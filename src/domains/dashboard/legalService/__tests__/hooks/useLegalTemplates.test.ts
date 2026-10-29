import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchLegalTemplates } from '../../api';
import useLegalTemplates from '../../hooks/useLegalDocs';

vi.mock('../../api', () => ({
    fetchLegalTemplates: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
}));

const mockApiTemplates = [
    { id: 1, title: 'NDA Template', description: 'Non-disclosure agreement', timeEstimate: '30 mins', category: 'Legal', iconKey: 'nda' },
    { id: 2, title: 'Employment Contract', description: 'Standard employment contract', timeEstimate: '45 mins', category: 'HR', iconKey: 'employment' },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useLegalTemplates', () => {
    it('should fetch templates on mount and map to LegalTemplate shape', async () => {
        (fetchLegalTemplates as Mock).mockResolvedValueOnce({ data: mockApiTemplates });

        const { result } = renderHook(() => useLegalTemplates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.templates).toHaveLength(2);
        expect(result.current.templates[0]).toEqual({
            id: '1',
            title: 'NDA Template',
            description: 'Non-disclosure agreement',
            timeEstimate: '30 mins',
            category: 'Legal',
            iconKey: 'nda',
        });
    });

    it('should set templates to empty array when API returns false', async () => {
        (fetchLegalTemplates as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useLegalTemplates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.templates).toEqual([]);
    });

    it('should set templates to empty array when API returns no data property', async () => {
        (fetchLegalTemplates as Mock).mockResolvedValueOnce({});

        const { result } = renderHook(() => useLegalTemplates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.templates).toEqual([]);
    });

    it('should set isLoading to true then false after fetch', async () => {
        (fetchLegalTemplates as Mock).mockResolvedValueOnce({ data: mockApiTemplates });

        const { result } = renderHook(() => useLegalTemplates());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
