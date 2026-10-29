import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { getKybStatus } from '../../../api/admin/kybStatusApi';
import { useKybStatusApi } from '../../../hooks/admin/useKybStatusApi';
import { setBusinessType, setKybInfo, setKybStage } from '../../../slices/corporateCardsSlice';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    getKybStatus: vi.fn(),
}));

vi.mock('../../../slices/corporateCardsSlice', () => ({
    setKybStage: vi.fn((stage: string) => ({ type: 'SET_KYB_STAGE', payload: stage })),
    setKybInfo: vi.fn((info: unknown) => ({ type: 'SET_KYB_INFO', payload: info })),
    setBusinessType: vi.fn((type: string | null) => ({ type: 'SET_BUSINESS_TYPE', payload: type })),
}));

const mockDispatch = vi.fn();
const DEFAULT_AUTH = { reducer: { auth: { role: 'admin', id: 5 } } };
let mockAuth: { reducer: { auth: { role: string; id: number } } } = DEFAULT_AUTH;

describe('useKybStatusApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth = DEFAULT_AUTH;
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    // The gate renders off kybStage, which defaults to 'initiate'. Any render where this hook claims to be
    // settled for an identity it has not actually fetched paints the Complete-KYB screen for a frame.
    //
    // These assert on the RENDER SEQUENCE, not on result.current: rerender() runs inside act(), which
    // flushes the effect before result.current can be read, so the offending render is invisible there.
    describe('the switch window', () => {
        const recordRenders = (enabled = true) => {
            const seen: boolean[] = [];
            const view = renderHook(
                ({ on }) => {
                    const hook = useKybStatusApi(on);
                    seen.push(hook.isLoading);
                    return hook;
                },
                { initialProps: { on: enabled } }
            );
            return { seen, ...view };
        };

        it('is already loading on the first render after the identity changes', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            const { seen, rerender } = recordRenders();
            await waitFor(() => expect(seen.at(-1)).toBe(false));

            mockAuth = { reducer: { auth: { role: 'corporate', id: 9 } } };
            const switchRender = seen.length;
            rerender({ on: true });

            expect(seen[switchRender]).toBe(true);
        });

        it('is already loading on the render that enables it', () => {
            (getKybStatus as Mock).mockImplementation(() => new Promise(() => {}));
            const { seen, rerender } = recordRenders(false);
            expect(seen.at(-1)).toBe(false);

            const switchRender = seen.length;
            rerender({ on: true });

            expect(seen[switchRender]).toBe(true);
        });

        it('settles again once the new identity is fetched', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            const { seen, rerender } = recordRenders();
            await waitFor(() => expect(seen.at(-1)).toBe(false));

            mockAuth = { reducer: { auth: { role: 'corporate', id: 9 } } };
            rerender({ on: true });

            await waitFor(() => expect(seen.at(-1)).toBe(false));
            expect(getKybStatus).toHaveBeenCalledWith('corporate', 9);
        });
    });

    describe('when enabled=false', () => {
        it('does not call getKybStatus', () => {
            renderHook(() => useKybStatusApi(false));
            expect(getKybStatus).not.toHaveBeenCalled();
        });

        it('returns isLoading=false immediately', () => {
            const { result } = renderHook(() => useKybStatusApi(false));
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('when enabled=true', () => {
        it('calls getKybStatus with role and id', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(getKybStatus).toHaveBeenCalledWith('admin', 5));
        });

        it('starts with isLoading=true when enabled', () => {
            (getKybStatus as Mock).mockImplementation(() => new Promise(() => {}));
            const { result } = renderHook(() => useKybStatusApi(true));
            expect(result.current.isLoading).toBe(true);
        });

        it('sets isLoading=false after fetch completes', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(result.current.isLoading).toBe(false));
        });

        it('dispatches setKybStage("landing") when there is no application row yet', async () => {
            (getKybStatus as Mock).mockResolvedValue({ data: { application: null } });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('landing');
        });

        it.each([
            ['PENDING', 'landing'],
            ['SUBMITTED', 'submitted'],
            ['UNDER_REVIEW', 'pending'],
            ['VERIFIED', 'verified'],
            ['REJECTED', 'rejected'],
            // COMPLETED is covered on its own: it depends on the acknowledgement, not the status alone.
        ])(
            'dispatches setKybStage("%s" -> "%s") when there is no kybReference yet',
            async (kybStatus, stage) => {
                (getKybStatus as Mock).mockResolvedValue({ data: { application: { kybStatus } } });
                renderHook(() => useKybStatusApi(true));
                await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
                expect(setKybStage).toHaveBeenCalledWith(stage);
            }
        );

        // A reviewer can mark COMPLETED without ever setting VERIFIED; the corporate is still owed the
        // verified screen once, so the acknowledgement decides this, not the status alone.
        it('shows the verified screen for a COMPLETED application the corporate has not seen yet', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: {
                        kybStatus: 'COMPLETED',
                        kybReference: 'KYB1',
                        verifiedAcknowledged: false,
                    },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('verified');
        });

        it('goes straight to the dashboard once the corporate has acknowledged it', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: {
                        kybStatus: 'COMPLETED',
                        kybReference: 'KYB1',
                        verifiedAcknowledged: true,
                    },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('complete');
        });

        it('shows the verified screen for a VERIFIED application regardless of the acknowledgement', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: { kybStatus: 'VERIFIED', verifiedAcknowledged: true },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('verified');
        });

        it('resumes on the upload step when a business type was chosen but nothing was submitted', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: { kybStatus: 'PENDING', kybReference: null, businessType: 'LLP' },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('upload');
        });

        it('hydrates the chosen business type, so the checklist survives a refresh', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: { kybStatus: 'PENDING', kybReference: null, businessType: 'LLP' },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(setBusinessType).toHaveBeenCalled());
            expect(setBusinessType).toHaveBeenCalledWith('LLP');
        });

        it('clears the business type when the application has none', async () => {
            (getKybStatus as Mock).mockResolvedValue({ data: { application: null } });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(setBusinessType).toHaveBeenCalled());
            expect(setBusinessType).toHaveBeenCalledWith(null);
        });

        it('keeps a submitted application on its status screen even though it has a business type', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: {
                        kybStatus: 'PENDING',
                        kybReference: 'KYBABC1234567',
                        businessType: 'LLP',
                    },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('submitted');
        });

        it('dispatches setKybStage("submitted") for PENDING once a kybReference has been stamped', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: { application: { kybStatus: 'PENDING', kybReference: 'KYBABC1234567' } },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('submitted');
        });

        it('falls back to "landing" for an unrecognized status', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: { application: { kybStatus: 'SOMETHING_NEW' } },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(setKybStage).toHaveBeenCalledWith('landing');
        });

        it('dispatches setKybInfo with refId, a formatted submittedOn, and the rejection reason', async () => {
            (getKybStatus as Mock).mockResolvedValue({
                data: {
                    application: {
                        kybStatus: 'REJECTED',
                        kybReference: 'KYB22402C442C',
                        updatedAt: '2026-07-17T17:56:00.000Z',
                        rejectionReason: 'Blurry PAN card.',
                    },
                },
            });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(setKybInfo).toHaveBeenCalled());
            expect(setKybInfo).toHaveBeenCalledWith({
                refId: 'KYB22402C442C',
                submittedOn: expect.any(String),
                rejectionReason: 'Blurry PAN card.',
                kybStatus: 'REJECTED',
            });
        });

        it('dispatches setKybInfo with nulls when there is no application row', async () => {
            (getKybStatus as Mock).mockResolvedValue({ data: { application: null } });
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(setKybInfo).toHaveBeenCalled());
            expect(setKybInfo).toHaveBeenCalledWith({
                refId: null,
                submittedOn: null,
                rejectionReason: null,
                kybStatus: null,
            });
        });

        it('does not dispatch when the API returns false', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(getKybStatus).toHaveBeenCalled());
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('exposes refetch, which re-invokes getKybStatus', async () => {
            (getKybStatus as Mock).mockResolvedValue(false);
            const { result } = renderHook(() => useKybStatusApi(true));
            await waitFor(() => expect(getKybStatus).toHaveBeenCalledTimes(1));

            await result.current.refetch();

            expect(getKybStatus).toHaveBeenCalledTimes(2);
        });
    });
});
