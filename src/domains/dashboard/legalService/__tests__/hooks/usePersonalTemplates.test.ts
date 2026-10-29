import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchPersonalTemplates } from '../../api';
import usePersonalTemplates from '../../hooks/usePersonalTemplates';

vi.mock('../../api', () => ({
    fetchPersonalTemplates: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
}));

const mockTemplates = [
    { id: 1, title: 'My Custom NDA', category: 'Legal', iconKey: 'nda', html: '<p>...</p>' },
    { id: 2, title: 'My Employment Doc', category: 'HR', iconKey: 'employment', html: '<p>...</p>' },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('usePersonalTemplates', () => {
    it('should fetch personal templates on mount and set state', async () => {
        (fetchPersonalTemplates as Mock).mockResolvedValueOnce({ data: mockTemplates });

        const { result } = renderHook(() => usePersonalTemplates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.templates).toEqual(mockTemplates);
    });

    it('should set templates to empty array when API returns false', async () => {
        (fetchPersonalTemplates as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => usePersonalTemplates());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.templates).toEqual([]);
    });

    it('should pass limit to the API when provided', async () => {
        (fetchPersonalTemplates as Mock).mockResolvedValueOnce({ data: mockTemplates });

        renderHook(() => usePersonalTemplates(5));

        await waitFor(() => expect(fetchPersonalTemplates).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 5 })
        ));
    });

    it('should not pass limit to API when not provided', async () => {
        (fetchPersonalTemplates as Mock).mockResolvedValueOnce({ data: [] });

        renderHook(() => usePersonalTemplates());

        await waitFor(() => expect(fetchPersonalTemplates).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 1, userType: 'merchant' })
        ));
        const callArg = (fetchPersonalTemplates as Mock).mock.calls[0][0];
        expect(callArg.limit).toBeUndefined();
    });

    it('should toggle isLoading correctly', async () => {
        (fetchPersonalTemplates as Mock).mockResolvedValueOnce({ data: [] });

        const { result } = renderHook(() => usePersonalTemplates());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
