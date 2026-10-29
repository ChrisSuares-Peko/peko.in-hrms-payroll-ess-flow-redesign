import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getSettingsApi } from '../../../api/settings';
import { fetchTemplateSettings } from '../../../api/template';
import { useTemplateGallery } from '../../../hooks/templateGallery/useTemplateGallery';

vi.mock('../../../api/template', () => ({
    fetchTemplateSettings: vi.fn(),
    saveTemplateSettings: vi.fn(),
}));

vi.mock('../../../api/settings', () => ({
    getSettingsApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
    useAppDispatch: vi.fn(() => vi.fn()),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: any) => x),
}));

const mockTemplates = [
    { id: 1, name: 'Template A', previewUrl: 'url1' },
    { id: 2, name: 'Template B', previewUrl: 'url2' },
];

const mockSettings = {
    data: { templateSettings: { templateId: 2 } },
};

describe('useTemplateGallery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches templates on mount and sets templates array', async () => {
        (fetchTemplateSettings as Mock).mockResolvedValue(mockTemplates);
        (getSettingsApi as Mock).mockResolvedValue(mockSettings);

        const { result } = renderHook(() => useTemplateGallery());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(fetchTemplateSettings).toHaveBeenCalled();
        expect(result.current.templates).toHaveLength(2);
    });

    it('isLoading becomes false after fetch', async () => {
        (fetchTemplateSettings as Mock).mockResolvedValue(mockTemplates);
        (getSettingsApi as Mock).mockResolvedValue(mockSettings);

        const { result } = renderHook(() => useTemplateGallery());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isLoading).toBe(false);
    });

    it('selectedId is set to 2 from settings (the current template)', async () => {
        (fetchTemplateSettings as Mock).mockResolvedValue(mockTemplates);
        (getSettingsApi as Mock).mockResolvedValue(mockSettings);

        const { result } = renderHook(() => useTemplateGallery());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.selectedId).toBe(2);
    });

    it('selected template sorted first (template id=2 should be first in the array)', async () => {
        (fetchTemplateSettings as Mock).mockResolvedValue(mockTemplates);
        (getSettingsApi as Mock).mockResolvedValue(mockSettings);

        const { result } = renderHook(() => useTemplateGallery());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.templates[0].id).toBe(2);
    });

    it('isSaving is false initially', async () => {
        (fetchTemplateSettings as Mock).mockResolvedValue(mockTemplates);
        (getSettingsApi as Mock).mockResolvedValue(mockSettings);

        const { result } = renderHook(() => useTemplateGallery());

        expect(result.current.isSaving).toBe(false);
    });
});
