import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { getTransactionComments, postTransactionComment } from '../../../api/user/transactionsApi';
import { useTransactionCommentsApi } from '../../../hooks/user/useTransactionCommentsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/transactionsApi', () => ({
    getTransactionComments: vi.fn(),
    postTransactionComment: vi.fn(),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateTime: vi.fn((date: Date) => `formatted:${date.toISOString()}`),
}));

const makeAuth = (
    overrides: Partial<{
        role: string;
        id: number;
        roleName: string;
        username: string;
        subCorporateId: null;
    }> = {}
) => ({
    role: 'user',
    id: 1,
    roleName: 'user',
    username: 'testuser',
    subCorporateId: null,
    ...overrides,
});

const makeState = (auth = makeAuth()) => ({ reducer: { auth } });

const makeComment = (
    overrides: Partial<{
        id: string;
        message: string;
        createdAt: string;
        authorName: string;
        authorRole: string;
        authorEmail: string;
        authorUserId: string;
    }> = {}
) => ({
    id: 'c1',
    message: 'Hello',
    createdAt: '2024-01-01T10:00:00Z',
    authorName: 'Alice',
    authorRole: 'cardholder',
    authorEmail: 'alice@example.com',
    authorUserId: 'u1',
    ...overrides,
});

const makeCommentsResponse = (comments: ReturnType<typeof makeComment>[]) => ({
    data: { comments },
});

describe('useTransactionCommentsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(makeState()));
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    });

    describe('when transactionId is null', () => {
        it('does not call getTransactionComments and comments is empty', async () => {
            const { result } = renderHook(() => useTransactionCommentsApi(null));

            await act(async () => {});

            expect(getTransactionComments).not.toHaveBeenCalled();
            expect(result.current.comments).toEqual([]);
            expect(result.current.isLoading).toBe(false);
        });

        it('isPosting starts as false', () => {
            const { result } = renderHook(() => useTransactionCommentsApi(null));
            expect(result.current.isPosting).toBe(false);
        });
    });

    describe('when transactionId is provided', () => {
        it('calls getTransactionComments on mount with correct args', async () => {
            (getTransactionComments as Mock).mockResolvedValueOnce(
                makeCommentsResponse([makeComment()])
            );

            renderHook(() => useTransactionCommentsApi('tx-123'));

            await waitFor(() => {
                expect(getTransactionComments).toHaveBeenCalledWith('user', 1, 'tx-123');
            });
        });

        it('populates comments after successful fetch', async () => {
            const comment = makeComment({
                id: 'c1',
                message: 'Test message',
                authorName: 'Bob',
                authorRole: 'cardholder',
            });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-123'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0]).toMatchObject({
                key: 'comment-c1',
                author: 'Bob',
                message: 'Test message',
                role: 'user',
            });
        });

        it('sets isLoading to true during fetch then false after', async () => {
            let resolveApi!: (value: any) => void;
            const apiPromise = new Promise(resolve => {
                resolveApi = resolve;
            });
            (getTransactionComments as Mock).mockReturnValueOnce(apiPromise);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-123'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(true);
            });

            await act(async () => {
                resolveApi(makeCommentsResponse([makeComment()]));
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });

    describe('toEntry role mapping', () => {
        it('maps authorRole containing "admin" to role="admin"', async () => {
            const comment = makeComment({ authorRole: 'Corporate Admin' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].role).toBe('admin');
        });

        it('maps authorRole "ADMIN" (uppercase) to role="admin"', async () => {
            const comment = makeComment({ authorRole: 'ADMIN' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].role).toBe('admin');
        });

        it('maps authorRole "cardholder" to role="user"', async () => {
            const comment = makeComment({ authorRole: 'cardholder' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].role).toBe('user');
        });

        it('maps empty authorRole to role="user"', async () => {
            const comment = makeComment({ authorRole: '' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].role).toBe('user');
        });
    });

    describe('toEntry authorName fallback', () => {
        it('uses "Unknown" when authorName is empty string', async () => {
            const comment = makeComment({ authorName: '' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].author).toBe('Unknown');
        });

        it('uses the provided authorName when not empty', async () => {
            const comment = makeComment({ authorName: 'Charlie' });
            (getTransactionComments as Mock).mockResolvedValueOnce(makeCommentsResponse([comment]));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            expect(result.current.comments[0].author).toBe('Charlie');
        });
    });

    describe('post() guard: empty/whitespace message', () => {
        it('returns false and does not call postTransactionComment for empty string', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            let returnValue!: boolean;
            await act(async () => {
                returnValue = await result.current.post('');
            });

            expect(returnValue).toBe(false);
            expect(postTransactionComment).not.toHaveBeenCalled();
        });

        it('returns false and does not call postTransactionComment for whitespace-only string', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            let returnValue!: boolean;
            await act(async () => {
                returnValue = await result.current.post('   ');
            });

            expect(returnValue).toBe(false);
            expect(postTransactionComment).not.toHaveBeenCalled();
        });

        it('returns false when transactionId is null even with valid message', async () => {
            const { result } = renderHook(() => useTransactionCommentsApi(null));
            await act(async () => {});

            let returnValue!: boolean;
            await act(async () => {
                returnValue = await result.current.post('Hello');
            });

            expect(returnValue).toBe(false);
            expect(postTransactionComment).not.toHaveBeenCalled();
        });
    });

    describe('post() with valid message', () => {
        it('calls postTransactionComment then re-fetches comments', async () => {
            const initialComments = [makeComment({ id: 'c1', message: 'First' })];
            const updatedComments = [
                makeComment({ id: 'c1', message: 'First' }),
                makeComment({ id: 'c2', message: 'Second' }),
            ];

            (getTransactionComments as Mock)
                .mockResolvedValueOnce(makeCommentsResponse(initialComments))
                .mockResolvedValueOnce(makeCommentsResponse(updatedComments));

            (postTransactionComment as Mock).mockResolvedValueOnce({ data: { id: 99 } });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(1);
            });

            let returnValue!: boolean;
            await act(async () => {
                returnValue = await result.current.post('Second');
            });

            expect(returnValue).toBe(true);
            expect(postTransactionComment).toHaveBeenCalledWith(
                'user',
                1,
                'tx-1',
                'Second',
                'CARDHOLDER'
            );
            expect(getTransactionComments).toHaveBeenCalledTimes(2);

            await waitFor(() => {
                expect(result.current.comments).toHaveLength(2);
            });
        });

        it('trims the message before posting', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce({ data: { id: 1 } });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            await act(async () => {
                await result.current.post('  trimmed message  ');
            });

            expect(postTransactionComment).toHaveBeenCalledWith(
                'user',
                1,
                'tx-1',
                'trimmed message',
                'CARDHOLDER'
            );
        });
    });

    describe('post() postAs override', () => {
        it('uses postAs="ADMIN" when explicitly provided', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce({ data: { id: 1 } });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            await act(async () => {
                await result.current.post('Hello', 'ADMIN');
            });

            expect(postTransactionComment).toHaveBeenCalledWith(
                'user',
                1,
                'tx-1',
                'Hello',
                'ADMIN'
            );
        });
    });

    describe('post() apiRole derived from roleName', () => {
        it('derives ADMIN when roleName contains "admin"', async () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn(makeState(makeAuth({ roleName: 'Corporate Admin' })))
            );
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce({ data: { id: 1 } });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            await act(async () => {
                await result.current.post('Admin message');
            });

            expect(postTransactionComment).toHaveBeenCalledWith(
                'user',
                1,
                'tx-1',
                'Admin message',
                'ADMIN'
            );
        });

        it('derives CARDHOLDER when roleName is "user"', async () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn(makeState(makeAuth({ roleName: 'user' })))
            );
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce({ data: { id: 1 } });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));
            await act(async () => {});

            await act(async () => {
                await result.current.post('User message');
            });

            expect(postTransactionComment).toHaveBeenCalledWith(
                'user',
                1,
                'tx-1',
                'User message',
                'CARDHOLDER'
            );
        });
    });

    describe('post() returns false when API returns false', () => {
        it('returns false and does not re-fetch when postTransactionComment returns false', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce(false);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            const callCountAfterMount = (getTransactionComments as Mock).mock.calls.length;

            let returnValue!: boolean;
            await act(async () => {
                returnValue = await result.current.post('Some message');
            });

            expect(returnValue).toBe(false);
            expect((getTransactionComments as Mock).mock.calls.length).toBe(callCountAfterMount);
        });
    });

    describe('isPosting state transitions', () => {
        it('transitions isPosting false→true during post→false after completion', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));

            let resolvePost!: (value: any) => void;
            const postPromise = new Promise(resolve => {
                resolvePost = resolve;
            });
            (postTransactionComment as Mock).mockReturnValueOnce(postPromise);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isPosting).toBe(false);

            let postResultPromise!: Promise<boolean>;
            act(() => {
                postResultPromise = result.current.post('Hello');
            });

            await waitFor(() => {
                expect(result.current.isPosting).toBe(true);
            });

            await act(async () => {
                resolvePost({ data: { id: 1 } });
                await postResultPromise;
            });

            await waitFor(() => {
                expect(result.current.isPosting).toBe(false);
            });
        });

        it('isPosting returns to false even when post API returns false', async () => {
            (getTransactionComments as Mock).mockResolvedValue(makeCommentsResponse([]));
            (postTransactionComment as Mock).mockResolvedValueOnce(false);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.post('Hello');
            });

            expect(result.current.isPosting).toBe(false);
        });
    });

    describe('failed getTransactionComments', () => {
        it('keeps comments as empty array when API returns false', async () => {
            (getTransactionComments as Mock).mockResolvedValueOnce(false);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.comments).toEqual([]);
        });

        it('keeps comments as empty array when response has no data.comments', async () => {
            (getTransactionComments as Mock).mockResolvedValueOnce({ data: {} });

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.comments).toEqual([]);
        });

        it('keeps comments as empty array when response is null', async () => {
            (getTransactionComments as Mock).mockResolvedValueOnce(null);

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.comments).toEqual([]);
        });
    });

    describe('initial state', () => {
        it('returns correct initial state before any async work', () => {
            (getTransactionComments as Mock).mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            expect(result.current.comments).toEqual([]);
            expect(result.current.isPosting).toBe(false);
            expect(typeof result.current.post).toBe('function');
        });

        it('has isLoading true immediately when transactionId is provided', () => {
            (getTransactionComments as Mock).mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useTransactionCommentsApi('tx-1'));

            expect(result.current.isLoading).toBe(true);
        });

        it('has isLoading false initially when transactionId is null', () => {
            const { result } = renderHook(() => useTransactionCommentsApi(null));

            expect(result.current.isLoading).toBe(false);
        });
    });
});
