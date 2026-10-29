import { act, renderHook, waitFor } from '@testing-library/react';
import { addDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { useFileHandling } from '../../hooks/useFileHandling';

// Mock Firestore methods
vi.mock('firebase/firestore', async () => {
    const original = await vi.importActual('firebase/firestore');
    return {
        ...original,
        addDoc: vi.fn(),
        serverTimestamp: vi.fn(() => 'mockTimestamp'),
    };
});

// Mock `showToast`
vi.mock('@src/slices/apiSlice', async () => ({
    showToast: vi.fn(),
}));

describe('useFileHandling', () => {
    let dispatchMock: any;
    let handlePostChatFileMock: any;
    let currentUserMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        dispatchMock = vi.fn();
        handlePostChatFileMock = vi.fn().mockResolvedValue('mockFileUrl');
        currentUserMock = { email: 'test@example.com' };
    });

    it('should allow valid file selection and set preview', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        const file = new File(['test'], 'test.png', { type: 'image/png' });

        const event = {
            target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        await act(async () => {
            await result.current.handleInputChange(event);
        });

        // ✅ Wait for FileReader to finish setting `previewImage`
        await waitFor(() => expect(result.current.previewImage).toBeTruthy());

        expect(result.current.file).toBe(file);
        expect(result.current.previewVisible).toBe(true);
    });

    it('should reject unsupported file types and show toast', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

        const event = {
            target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        await act(async () => {
            await result.current.handleInputChange(event);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'Unsupported file format!',
                variant: 'error',
            })
        );
        expect(result.current.file).toBeNull();
    });

    it('should reject large files and show toast', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        const largeFile = new File(['test'.repeat(1024 * 1024)], 'large.pdf', {
            type: 'application/pdf',
        });

        Object.defineProperty(largeFile, 'size', { value: 2.5 * 1024 * 1024 });

        const event = {
            target: { files: [largeFile] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        await act(async () => {
            await result.current.handleInputChange(event);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({
                description: 'File size must be smaller than 2048KB!',
                variant: 'error',
            })
        );
        expect(result.current.file).toBeNull();
    });

    it('should send a file and reset state', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        const file = new File(['test'], 'test.png', { type: 'image/png' });

        await act(async () => {
            // 🔹 Simulate file selection
            await result.current.handleInputChange({
                target: { files: [file] },
            } as unknown as React.ChangeEvent<HTMLInputElement>);
        });

        await waitFor(() => expect(result.current.file).toBe(file)); // ✅ Ensure file is set

        await act(async () => {
            await result.current.handleProceedFileSend('mockMessagesRef'); // Call function
        });

        expect(handlePostChatFileMock).toHaveBeenCalledTimes(1); // ✅ Ensure mock function is actually called
        expect(handlePostChatFileMock).toHaveBeenCalledWith({ target: { files: [file] } });

        expect(addDoc).toHaveBeenCalledWith('mockMessagesRef', {
            type: 'image',
            fileUrl: 'mockFileUrl',
            text: '',
            sender: currentUserMock.email,
            createdAt: 'mockTimestamp',
            seenBy: [],
        });

        expect(result.current.file).toBeNull();
        expect(result.current.previewVisible).toBe(false);
        expect(result.current.previewImage).toBeUndefined();
    });

    it('should not send a file if no file is selected', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        await act(async () => {
            await result.current.handleProceedFileSend('mockMessagesRef');
        });

        expect(handlePostChatFileMock).not.toHaveBeenCalled();
        expect(addDoc).not.toHaveBeenCalled();
    });

    it('should reset file handling state', async () => {
        const { result } = renderHook(() =>
            useFileHandling(dispatchMock, handlePostChatFileMock, currentUserMock)
        );

        await act(() => {
            result.current.setPreviewVisible(true);
            result.current.resetState();
        });

        expect(result.current.file).toBeNull();
        expect(result.current.previewVisible).toBe(false);
        expect(result.current.previewImage).toBeUndefined();
    });
});
