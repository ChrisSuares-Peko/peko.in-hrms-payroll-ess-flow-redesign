import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { ssoLoginApi } from '../../api/index';
import useSsoLogin from '../../hooks/useSSOLogin';

vi.mock('../../api/index', () => ({
    ssoLoginApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

describe('useSsoLogin Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: 'user-123' });
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        });
        window.location.href = '';
    });

    it('should initialize with isLoading as false', () => {
        const { result } = renderHook(() => useSsoLogin());
        expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to true when handleSsoLogin is called', async () => {
        (ssoLoginApi as Mock).mockResolvedValue({
            token: 'mockToken',
            redirectLink: 'https://example.com',
        });

        const { result } = renderHook(() => useSsoLogin());

        act(() => {
            result.current.handleSsoLogin();
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('should call ssoLoginApi with correct parameters', async () => {
        (ssoLoginApi as Mock).mockResolvedValue({
            token: 'mockToken',
            redirectLink: 'https://example.com',
        });

        const { result } = renderHook(() => useSsoLogin());

        await act(async () => {
            await result.current.handleSsoLogin();
        });

        expect(ssoLoginApi).toHaveBeenCalledWith({
            userType: 'admin',
            userId: 'user-123',
        });
    });

    it('should set cookie and redirect when API call is successful', async () => {
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        });

        (ssoLoginApi as Mock).mockResolvedValue({
            token: 'mockToken',
            redirectLink: 'https://example.com',
        });

        const { result } = renderHook(() => useSsoLogin());

        await act(async () => {
            await result.current.handleSsoLogin();
        });

        expect(document.cookie).toContain('aisensySSOToken=mockToken');
        expect(window.location.href).toBe('http://localhost:3000/');
    });

    it('should not set cookie or redirect if API call fails', async () => {
        (ssoLoginApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useSsoLogin());

        await act(async () => {
            await result.current.handleSsoLogin();
        });

        expect(document.cookie).toBe('');
        expect(window.location.href).toBe('http://localhost:3000/');
    });

    it('should reset isLoading to false after execution', async () => {
        (ssoLoginApi as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useSsoLogin());

        await act(async () => {
            await result.current.handleSsoLogin();
        });

        expect(result.current.isLoading).toBe(false);
    });
});
