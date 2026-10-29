import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    Gstr9FilingsByYear,
    downloadGstr9Pdf,
    fileGstr9,
    generateGstr9EvcOtp,
    getGstr9Draft,
    getGstr9FilingStatus,
    getGstr9Section8A,
    proceedGstr9,
    saveGstr9Draft,
} from '../api';
import { buildGstr9FilePayload, buildGstr9SavePayload } from '../pages/gstr9/gstr9Utils';
import { Gstr9DraftData, Gstr9Section8AData } from '../types';

const useGstr9 = (gstin: string) => {
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);

    const [draftData, setDraftData] = useState<Gstr9DraftData | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const [section8aData, setSection8aData] = useState<Gstr9Section8AData | null>(null);
    const [isFetchingSection8A, setIsFetchingSection8A] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isProceeding, setIsProceeding] = useState(false);
    const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
    const [isFiling, setIsFiling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [detailsFormData, setDetailsFormData] = useState<unknown>(null);
    const [filingStatus, setFilingStatus] = useState<Gstr9FilingsByYear | null>(null);
    const [isFetchingFilingStatus, setIsFetchingFilingStatus] = useState(false);

    const fetchFilingStatus = useCallback(async () => {
        if (!gstin) return;
        setIsFetchingFilingStatus(true);
        const data = await getGstr9FilingStatus({ userId: id, userType: role, gstin });
        setIsFetchingFilingStatus(false);
        if (data) setFilingStatus(data);
    }, [id, role, gstin]);

    const fetchDraft = useCallback(
        async (financialYear: string) => {
            if (!gstin || !financialYear) return false;
            setIsFetching(true);
            const data = await getGstr9Draft({ userId: id, userType: role, gstin, financialYear });
            setIsFetching(false);
            if (data && 'requiresAuth' in data) {
                dispatch(showToast({ description: data.message, variant: 'error' }));
                return false;
            }
            if (data) {
                setDraftData(data as Gstr9DraftData);
                return true;
            }
            return false;
        },
        [id, role, gstin, dispatch]
    );

    const fetchSection8A = useCallback(
        async (financialYear: string) => {
            if (!gstin || !financialYear) return false;
            setIsFetchingSection8A(true);
            const data = await getGstr9Section8A({
                userId: id,
                userType: role,
                gstin,
                financialYear,
            });
            setIsFetchingSection8A(false);
            if (data) {
                setSection8aData(data as Gstr9Section8AData);
                return true;
            }
            return false;
        },
        [id, role, gstin]
    );

    const saveDraft = useCallback(
        async (financialYear: string) => {
            if (!gstin || !financialYear || !draftData?.formData) return false;
            setIsSaving(true);
            const body = buildGstr9SavePayload(draftData.formData);
            const resp = await saveGstr9Draft({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                body,
            });
            setIsSaving(false);
            if (!resp) {
                dispatch(
                    showToast({ description: 'Failed to save GSTR-9 draft', variant: 'error' })
                );
                return false;
            }
            if (!resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
                return false;
            }
            dispatch(
                showToast({ description: 'GSTR-9 draft saved successfully', variant: 'success' })
            );
            return true;
        },
        [id, role, gstin, draftData, dispatch]
    );

    const proceedDraft = useCallback(
        async (financialYear: string) => {
            if (!gstin || !financialYear) return false;
            setIsProceeding(true);
            const resp = await proceedGstr9({ userId: id, userType: role, gstin, financialYear });
            setIsProceeding(false);
            if (!resp) {
                dispatch(
                    showToast({
                        description: 'Failed to proceed. Please try again.',
                        variant: 'error',
                    })
                );
                return false;
            }
            if (!resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
                return false;
            }
            if (resp.data) setDetailsFormData(resp);
            return true;
        },
        [id, role, gstin, dispatch]
    );

    const generateEvcOtp = useCallback(
        async (pan: string) => {
            if (!gstin || !pan) return false;
            setIsGeneratingOtp(true);
            const resp = await generateGstr9EvcOtp({ userId: id, userType: role, gstin, pan });
            setIsGeneratingOtp(false);
            if (!resp) {
                dispatch(
                    showToast({
                        description: 'Failed to send OTP. Please try again.',
                        variant: 'error',
                    })
                );
                return false;
            }
            if (!resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
                return false;
            }
            return true;
        },
        [id, role, gstin, dispatch]
    );

    const fileReturn = useCallback(
        async (financialYear: string, pan: string, otp: string) => {
            if (!gstin || !financialYear || !pan || !otp || !detailsFormData) return false;
            setIsFiling(true);
            const formData = buildGstr9FilePayload(detailsFormData);
            const resp = await fileGstr9({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                pan,
                otp,
                formData,
            });
            setIsFiling(false);
            if (!resp) {
                dispatch(
                    showToast({
                        description: 'Failed to file GSTR-9. Please try again.',
                        variant: 'error',
                    })
                );
                return false;
            }
            if (!resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
                return false;
            }
            const ackNum = resp.data?.ackNum;
            if (!ackNum) {
                dispatch(
                    showToast({
                        description: 'No ARN received. Please verify filing status on GST portal.',
                        variant: 'error',
                    })
                );
                return false;
            }
            return { ackNum, filedAt: resp.data?.filedAt ?? new Date().toISOString() };
        },
        [id, role, gstin, detailsFormData, dispatch]
    );

    const downloadPdf = useCallback(
        async (financialYear: string) => {
            if (!gstin || !financialYear) return;
            setIsDownloading(true);
            const resp = await downloadGstr9Pdf({
                userId: id,
                userType: role,
                gstin,
                financialYear,
            });
            setIsDownloading(false);
            if (resp && resp.buffer) {
                const bytes = new Uint8Array(resp.buffer.data);
                const blob = new Blob([bytes], { type: resp.fileType || 'application/pdf' });
                saveAs(blob, `GSTR-9-${gstin}-${financialYear}.pdf`);
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to download PDF. Please try again.',
                        variant: 'error',
                    })
                );
            }
        },
        [id, role, gstin, dispatch]
    );

    return {
        draftData,
        isFetching,
        fetchDraft,
        section8aData,
        isFetchingSection8A,
        fetchSection8A,
        saveDraft,
        isSaving,
        proceedDraft,
        isProceeding,
        generateEvcOtp,
        isGeneratingOtp,
        fileReturn,
        isFiling,
        filingStatus,
        isFetchingFilingStatus,
        fetchFilingStatus,
        downloadPdf,
        isDownloading,
    };
};

export default useGstr9;
