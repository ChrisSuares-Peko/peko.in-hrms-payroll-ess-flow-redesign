import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getCorporateAgreement,
    initiateKyb,
    saveCorporateAgreement,
    sendAgreementForEsign,
    setAgreementSignMethod,
    uploadKybDocuments,
} from '../../../api/admin/kybStatusApi';
import {
    EMPTY_AGREEMENT,
    ESIGN_POLL_MS,
    useCorporateAgreement,
} from '../../../hooks/admin/useCorporateAgreement';
import { setKybStage } from '../../../slices/corporateCardsSlice';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    getCorporateAgreement: vi.fn(),
    saveCorporateAgreement: vi.fn(),
    sendAgreementForEsign: vi.fn(),
    setAgreementSignMethod: vi.fn(),
    downloadAgreementTemplate: vi.fn(),
    uploadKybDocuments: vi.fn(),
    initiateKyb: vi.fn(),
}));

vi.mock('../../../slices/corporateCardsSlice', () => ({
    setKybStage: vi.fn((stage: string) => ({ type: 'SET_KYB_STAGE', payload: stage })),
}));

const mockDispatch = vi.fn();
const onSubmitted = vi.fn();

const agreementResponse = (data: Record<string, unknown>) => ({ data });

const renderAgreement = (enabled = true) =>
    renderHook(() => useCorporateAgreement(onSubmitted, enabled));

describe('useCorporateAgreement', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({
                reducer: {
                    auth: { role: 'admin', id: 5 },
                    corporateCards: { businessType: 'LLP' },
                },
            })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({ agreement: null, signMethod: null, esignStatus: null })
        );
        (saveCorporateAgreement as Mock).mockResolvedValue({ status: true });
        (sendAgreementForEsign as Mock).mockResolvedValue(
            agreementResponse({ esignStatus: 'PENDING_DISPATCH' })
        );
        (uploadKybDocuments as Mock).mockResolvedValue({ status: true });
        (initiateKyb as Mock).mockResolvedValue({ status: true });
    });

    it('restores a previously saved draft, so a refresh does not lose the form', async () => {
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({
                agreement: { entityName: 'Acme Technologies Pvt Ltd', regCity: 'Bengaluru' },
                signMethod: 'E_SIGN',
                esignStatus: null,
            })
        );

        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.agreement.entityName).toBe('Acme Technologies Pvt Ltd');
        expect(result.current.agreement.regCity).toBe('Bengaluru');
        expect(result.current.agreement.bankName).toBe(EMPTY_AGREEMENT.bankName);
    });

    /**
     * The server serialises every blank column as null. Spread straight over the defaults that turns ''
     * into null, and a null fails Yup's string type check before any rule runs — which disabled "Send for
     * e-Signature" over an optional field the user had correctly left empty, with no message on screen.
     */
    it('falls back to the empty defaults for columns the server returned as null', async () => {
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({
                agreement: {
                    entityName: 'Acme Technologies Pvt Ltd',
                    tanNumber: null,
                    cinLlpNumber: null,
                    bankBranch: null,
                    signatoryIsPep: null,
                },
                signMethod: 'E_SIGN',
                esignStatus: null,
            })
        );

        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.agreement.tanNumber).toBe('');
        expect(result.current.agreement.cinLlpNumber).toBe('');
        expect(result.current.agreement.bankBranch).toBe('');
        expect(result.current.agreement.signatoryIsPep).toBe(false);
        expect(result.current.agreement.entityName).toBe('Acme Technologies Pvt Ltd');
    });

    /**
     * The server decides which evidence a submission needs. A silently unsaved switch leaves this screen
     * satisfied by an uploaded copy while the server still demands an e-signature (or the reverse), and
     * every submit is refused with a message the corporate never sees.
     */
    describe('switching the signing method', () => {
        it('puts the method back and says so when the save fails', async () => {
            (setAgreementSignMethod as Mock).mockResolvedValue(false);
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            const before = result.current.signMethod;

            await act(async () => {
                await result.current.chooseSignMethod('UPLOAD');
            });

            expect(result.current.signMethod).toBe(before);
            expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
        });

        it('keeps the new method when the save succeeds', async () => {
            (setAgreementSignMethod as Mock).mockResolvedValue({ status: true });
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            await act(async () => {
                await result.current.chooseSignMethod('UPLOAD');
            });

            expect(result.current.signMethod).toBe('UPLOAD');
            expect(showToast).not.toHaveBeenCalledWith(
                expect.objectContaining({ variant: 'error' })
            );
        });
    });

    it('keeps a stored false rather than treating it as absent', async () => {
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({
                agreement: { billSameAsRegistered: false, signatoryIsPep: true },
                signMethod: 'E_SIGN',
                esignStatus: null,
            })
        );

        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.agreement.billSameAsRegistered).toBe(false);
        expect(result.current.agreement.signatoryIsPep).toBe(true);
    });

    it('does not fetch anything while the step is not showing', async () => {
        const { result } = renderAgreement(false);

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getCorporateAgreement).not.toHaveBeenCalled();
    });

    it('saves a partial draft without touching the restored values it is editing', async () => {
        const { result } = renderAgreement();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.saveDraft({
                ...EMPTY_AGREEMENT,
                entityName: 'Acme Technologies Pvt Ltd',
            });
        });

        expect(saveCorporateAgreement).toHaveBeenCalledWith(
            'admin',
            5,
            expect.objectContaining({ entityName: 'Acme Technologies Pvt Ltd' })
        );
        expect(result.current.agreement.entityName).toBe('');
    });

    it('reports nothing queued until the agreement has actually been sent', async () => {
        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.esignQueued).toBe(false);
        expect(result.current.esignSigned).toBe(false);
    });

    it('moves to the awaiting-signature state after a successful send', async () => {
        const { result } = renderAgreement();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.sendForEsign({ ...EMPTY_AGREEMENT, entityName: 'Acme' });
        });

        expect(result.current.esignStatus).toBe('PENDING_DISPATCH');
        expect(result.current.esignQueued).toBe(true);
        expect(result.current.esignSigned).toBe(false);
    });

    it('stays on the form when the send failed', async () => {
        (sendAgreementForEsign as Mock).mockResolvedValue(false);
        const { result } = renderAgreement();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.sendForEsign({ ...EMPTY_AGREEMENT, entityName: 'Acme' });
        });

        expect(result.current.esignQueued).toBe(false);
    });

    it('reports a completed signature so the screen can confirm it', async () => {
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({ agreement: null, signMethod: 'E_SIGN', esignStatus: 'SIGNED' })
        );

        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.esignSigned).toBe(true));
        expect(result.current.esignQueued).toBe(true);
    });

    it('treats a failed dispatch as not queued, so the form comes back', async () => {
        (getCorporateAgreement as Mock).mockResolvedValue(
            agreementResponse({ agreement: null, signMethod: 'E_SIGN', esignStatus: 'FAILED' })
        );

        const { result } = renderAgreement();

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.esignQueued).toBe(false);
    });

    it('submits the application with the stored business type and moves to the submitted screen', async () => {
        const { result } = renderAgreement();
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.submitForVerification(null);
        });

        expect(initiateKyb).toHaveBeenCalledWith('admin', 5, 'LLP');
        expect(setKybStage).toHaveBeenCalledWith('submitted');
        expect(onSubmitted).toHaveBeenCalled();
    });

    describe('while awaiting the signature', () => {
        beforeEach(() => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        // The card tells the corporate we are checking automatically, so it has to be true.
        it('keeps checking for the signature and switches to signed when it lands', async () => {
            (getCorporateAgreement as Mock).mockResolvedValue(
                agreementResponse({ agreement: null, signMethod: 'E_SIGN', esignStatus: 'SENT' })
            );
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.esignStatus).toBe('SENT'));
            const callsAfterMount = (getCorporateAgreement as Mock).mock.calls.length;

            (getCorporateAgreement as Mock).mockResolvedValue(
                agreementResponse({ agreement: null, signMethod: 'E_SIGN', esignStatus: 'SIGNED' })
            );
            await act(async () => {
                vi.advanceTimersByTime(ESIGN_POLL_MS);
            });

            expect((getCorporateAgreement as Mock).mock.calls.length).toBeGreaterThan(
                callsAfterMount
            );
            await waitFor(() => expect(result.current.esignSigned).toBe(true));
        });

        it('stops checking once the signature is in', async () => {
            (getCorporateAgreement as Mock).mockResolvedValue(
                agreementResponse({ agreement: null, signMethod: 'E_SIGN', esignStatus: 'SIGNED' })
            );
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.esignSigned).toBe(true));
            const settled = (getCorporateAgreement as Mock).mock.calls.length;

            await act(async () => {
                vi.advanceTimersByTime(ESIGN_POLL_MS * 3);
            });

            expect((getCorporateAgreement as Mock).mock.calls.length).toBe(settled);
        });

        it('does not check while the form is still being filled in', async () => {
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.isLoading).toBe(false));
            const settled = (getCorporateAgreement as Mock).mock.calls.length;

            await act(async () => {
                vi.advanceTimersByTime(ESIGN_POLL_MS * 3);
            });

            expect((getCorporateAgreement as Mock).mock.calls.length).toBe(settled);
        });
    });

    describe('the signed copy on the upload route', () => {
        beforeEach(() => {
            (getCorporateAgreement as Mock).mockResolvedValue(
                agreementResponse({ agreement: null, signMethod: 'UPLOAD', esignStatus: null })
            );
        });

        it('does not re-upload a signed copy that autosave already stored', async () => {
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.signMethod).toBe('UPLOAD'));

            await act(async () => {
                await result.current.submitForVerification(null, true);
            });

            expect(uploadKybDocuments).not.toHaveBeenCalled();
            expect(initiateKyb).toHaveBeenCalled();
        });

        it('uploads the staged copy when autosave had not stored it yet', async () => {
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.signMethod).toBe('UPLOAD'));

            await act(async () => {
                await result.current.submitForVerification(
                    { base64: 'abc', format: 'pdf', name: 'signed.pdf' },
                    false
                );
            });

            expect(uploadKybDocuments).toHaveBeenCalledWith('admin', 5, [
                {
                    documentName: 'Corporate_Agreement',
                    fileBase: 'abc',
                    fileFormat: 'pdf',
                    fileName: 'signed.pdf',
                },
            ]);
        });

        it('refuses to submit with no signed copy at all', async () => {
            const { result } = renderAgreement();
            await waitFor(() => expect(result.current.signMethod).toBe('UPLOAD'));

            await act(async () => {
                await result.current.submitForVerification(null, false);
            });

            expect(initiateKyb).not.toHaveBeenCalled();
        });
    });
});
