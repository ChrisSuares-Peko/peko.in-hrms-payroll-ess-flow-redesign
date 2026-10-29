import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

import { postChatFile } from '../../api/index';
import usePostChatFile from '../../hooks/usePostChatFile';

// ✅ Mock `postChatFile` API function
vi.mock('../../api/index', () => ({
    postChatFile: vi.fn(),
}));

describe('usePostChatFile', () => {
    let mockFile: File;
    let mockEvent: Partial<React.ChangeEvent<HTMLInputElement>>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

        mockEvent = {
            target: {
                files: {
                    0: mockFile,
                    length: 1,
                    item: (index: number) => (index === 0 ? mockFile : null),
                } as unknown as FileList,
            } as unknown as EventTarget & HTMLInputElement,
        };

        // ✅ Mock `FileReader` behavior
        global.FileReader = class {
            result: string | ArrayBuffer | null = `data:application/pdf;base64,dummyBase64String`;

            onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

            // eslint-disable-next-line func-names
            readAsDataURL = vi.fn().mockImplementation(function (this: FileReader) {
                if (this.onload) this.onload({ target: this } as ProgressEvent<FileReader>);
            });
        } as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize the hook correctly', () => {
        const { result } = renderHook(() => usePostChatFile());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(typeof result.current.handlePostChatFile).toBe('function');
    });

    it('should upload a file and return public URL', async () => {
        const mockPublicUrl = 'https://mock-url.com/test.pdf';
        (postChatFile as Mock).mockResolvedValue({ publicUrl: mockPublicUrl });

        const { result } = renderHook(() => usePostChatFile());

        await act(async () => {
            const url = await result.current.handlePostChatFile(
                mockEvent as React.ChangeEvent<HTMLInputElement>
            );
            expect(url).toBe(mockPublicUrl);
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBe(mockPublicUrl);
        expect(postChatFile).toHaveBeenCalledWith({
            file: 'dummyBase64String',
            fileFormat: 'pdf',
            fileName: 'test.pdf',
        });
    });

    it('should handle empty file selection gracefully', async () => {
        const { result } = renderHook(() => usePostChatFile());

        await act(async () => {
            const url = await result.current.handlePostChatFile({
                target: { files: null },
            } as React.ChangeEvent<HTMLInputElement>);
            expect(url).toBeNull();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(postChatFile).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
        (postChatFile as Mock).mockRejectedValue(new Error('Upload failed'));

        const { result } = renderHook(() => usePostChatFile());

        await act(async () => {
            try {
                await result.current.handlePostChatFile(
                    mockEvent as React.ChangeEvent<HTMLInputElement>
                );
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Upload failed');
            }
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
    });
});
