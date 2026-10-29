import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchTemplateById } from '../../api';
import useTemplateDetail from '../../hooks/useTemplateDetail';

vi.mock('../../api', () => ({
    fetchTemplateById: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useTemplateDetail', () => {
    it('should return template data on successful fetch', async () => {
        const mockResponse = {
            data: {
                id: 42,
                title: 'NDA Agreement',
                description: 'Non-disclosure agreement',
                timeEstimate: '10 mins',
                category: 'Legal',
                iconKey: 'nda',
                fields: [{ key: 'partyA', label: 'Party A', type: 'text', section: 'Parties', required: true }],
                documentUrl: 'https://example.com/nda.pdf',
                html: '<p>NDA content</p>',
            },
        };
        (fetchTemplateById as Mock).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useTemplateDetail('tmpl-42'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.template).toEqual({
            id: '42',
            title: 'NDA Agreement',
            description: 'Non-disclosure agreement',
            timeEstimate: '10 mins',
            category: 'Legal',
            iconKey: 'nda',
            fields: [{ key: 'partyA', label: 'Party A', type: 'text', section: 'Parties', required: true }],
            documentUrl: 'https://example.com/nda.pdf',
            html: '<p>NDA content</p>',
        });
    });

    it('should return null template when API returns no data', async () => {
        (fetchTemplateById as Mock).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useTemplateDetail('tmpl-99'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.template).toBeNull();
    });

    it('should return null template when API response has no data property', async () => {
        (fetchTemplateById as Mock).mockResolvedValueOnce({});

        const { result } = renderHook(() => useTemplateDetail('tmpl-99'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.template).toBeNull();
    });

    it('should call fetchTemplateById with correct params', async () => {
        (fetchTemplateById as Mock).mockResolvedValueOnce(null);

        renderHook(() => useTemplateDetail('tmpl-7'));

        await waitFor(() => {
            expect(fetchTemplateById).toHaveBeenCalledWith({
                userId: 1,
                userType: 'merchant',
                templateId: 'tmpl-7',
            });
        });
    });

    it('should not call fetchTemplateById when templateId is empty', async () => {
        renderHook(() => useTemplateDetail(''));

        await waitFor(() => {
            expect(fetchTemplateById).not.toHaveBeenCalled();
        });
    });

    it('should set html to null when html is undefined in response', async () => {
        const mockResponse = {
            data: {
                id: 1,
                title: 'Test',
                description: '',
                timeEstimate: '',
                category: '',
                iconKey: '',
                fields: [],
                documentUrl: '',
                html: undefined,
            },
        };
        (fetchTemplateById as Mock).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useTemplateDetail('tmpl-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.template?.html).toBeNull();
    });
});
