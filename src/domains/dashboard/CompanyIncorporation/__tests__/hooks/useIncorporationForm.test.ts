import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { submitApplication, uploadDocument } from '../../api';
import { useIncorporationForm } from '../../hooks/useIncorporationForm';
import { EntityType } from '../../types';

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'toast', payload })),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
}));

vi.mock('@routes/paths', () => ({
    paths: { companyIncorporation: { index: '/company-incorporation', payment: 'payment' } },
}));

vi.mock('../../api', () => ({
    submitApplication: vi.fn(),
    uploadDocument: vi.fn(),
    getApplicationDetail: vi.fn(),
}));

// Keep document generation cheap and deterministic.
vi.mock('../../utils/moaAoaTemplate', () => ({
    buildWordDocHtml: vi.fn(() => '<html></html>'),
    generateMoaContent: vi.fn(() => 'MOA'),
    generateAoaContent: vi.fn(() => 'AOA'),
    generateLlpAgreementContent: vi.fn(() => 'LLP'),
}));

const mockSubmit = submitApplication as Mock;
const mockUpload = uploadDocument as Mock;

const setCurrentApplication = (currentApplication: any) => {
    (useAppSelector as Mock).mockImplementation((cb: (s: any) => any) =>
        cb({
            reducer: {
                auth: { id: 7, role: 'corporate' },
                incorporation: { currentApplication, isLoading: false },
            },
        })
    );
};

describe('useIncorporationForm.handleSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUpload.mockResolvedValue({ docType: 'x', fileUrl: 'u' });
    });

    it('submits an OPC application with nominee and moaAoa, then uploads generated MOA/AOA docs', async () => {
        setCurrentApplication({
            entityType: EntityType.OPC,
            applicantDetails: { fullName: 'A' },
            nominee: { name: 'Nom' },
            moaAoa: { moaType: 'standard', aoaType: 'standard', confirmed: true },
        });
        mockSubmit.mockResolvedValue({ ok: true, data: { applicationId: 'INC/2026/00001' } });

        const { result } = renderHook(() => useIncorporationForm());
        await act(async () => {
            await result.current.handleSubmit();
        });

        const { body } = mockSubmit.mock.calls[0][0];
        expect(body.nominee).toEqual({ name: 'Nom' });
        expect(body.moaAoa).toEqual({ moaType: 'standard', aoaType: 'standard', confirmed: true });
        expect(body.llpAgreement).toBeUndefined();

        // standard MOA + AOA are auto-generated and uploaded
        expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({ docType: 'moa_draft' }));
        expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({ docType: 'aoa_draft' }));
        expect(mockNavigate).toHaveBeenCalledWith('/company-incorporation/payment');
    });

    it('submits an LLP application with llpAgreement (no moaAoa) and uploads the LLP draft', async () => {
        setCurrentApplication({
            entityType: EntityType.LLP,
            applicantDetails: { fullName: 'A' },
            nominee: { name: 'ShouldBeStripped' },
            llpAgreement: { agreementType: 'standard', confirmed: true, meetingQuorum: '2' },
        });
        mockSubmit.mockResolvedValue({ ok: true, data: { applicationId: 'INC/2026/00002' } });

        const { result } = renderHook(() => useIncorporationForm());
        await act(async () => {
            await result.current.handleSubmit();
        });

        const { body } = mockSubmit.mock.calls[0][0];
        expect(body.llpAgreement).toEqual(expect.objectContaining({ agreementType: 'standard', confirmed: true }));
        expect(body.moaAoa).toBeUndefined();
        expect(body.nominee).toBeUndefined(); // nominee only kept for OPC

        expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({ docType: 'llp_agreement_draft' }));
        expect(mockNavigate).toHaveBeenCalledWith('/company-incorporation/payment');
    });

    it('shows the parsed validation error and does not navigate when submit fails', async () => {
        setCurrentApplication({ entityType: EntityType.PRIVATE_LIMITED, applicantDetails: {} });
        mockSubmit.mockResolvedValue({ ok: false, validationError: 'Applicant email must be a valid email address.' });

        const { result } = renderHook(() => useIncorporationForm());
        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({ description: 'Applicant email must be a valid email address.', variant: 'error' })
        );
        expect(mockUpload).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('reports failed document uploads and stops before navigating', async () => {
        setCurrentApplication({
            entityType: EntityType.PRIVATE_LIMITED,
            applicantDetails: { fullName: 'A' },
            moaAoa: { moaType: 'standard', aoaType: 'standard', confirmed: true },
        });
        mockSubmit.mockResolvedValue({ ok: true, data: { applicationId: 'INC/2026/00003' } });
        mockUpload.mockResolvedValue(false); // every upload fails

        const { result } = renderHook(() => useIncorporationForm());
        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(showToast).toHaveBeenCalledWith(
            expect.objectContaining({ description: expect.stringContaining('Some documents failed to upload') })
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
