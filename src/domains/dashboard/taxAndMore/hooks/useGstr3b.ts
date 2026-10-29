import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    downloadGstr3bPdf,
    fileGstr3b,
    generateGstrEvcOtp,
    getGstr3bAutoLiability,
    getGstr3bDetails,
    getGstr3bFiling,
    getGstr3bLedgers,
    offsetGstr3bLiability,
    saveGstr3bToPortal,
    updateGstr3bFormData,
    validateGstr3bReturn,
} from '../api/tax';
import { Gstr3bFiling, Gstr3bFormData, Gstr3bLedgers } from '../types';

const useGstr3b = (gstin: string, financialYear: string, month: number) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [months, setMonths] = useState<{ month: number; status: 'filed' | 'not_started' }[]>([]);
    const [isLoadingMonths, setIsLoadingMonths] = useState(false);
    const [filing, setFiling] = useState<Gstr3bFiling | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [ledgers, setLedgers] = useState<Gstr3bLedgers | null>(null);
    const [isFetchingLedgers, setIsFetchingLedgers] = useState(false);
    const [isOffsetting, setIsOffsetting] = useState(false);
    const [isFetchingAutoLiability, setIsFetchingAutoLiability] = useState(false);
    const [isFiling, setIsFiling] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [ackNum, setAckNum] = useState<string | null>(null);
    const [filedAt, setFiledAt] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        if (!gstin || !financialYear || !month) return false;
        setIsFetchingDetails(true);
        setDetailsError(null);
        const resp = await getGstr3bDetails({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        setIsFetchingDetails(false);
        if (resp && (resp as any).status) {
            const d = (resp as any).data;
            setFiling({
                formData: d.formData ?? null,
                retPeriod: d.retPeriod ?? null,
                autoLiability: d.autoLiability ?? null,
                status: (d.filingStatus as Gstr3bFiling['status']) ?? 'draft',
                ackNum: null,
                filedAt: null,
            });
            return true;
        }
        const respMsg: string = (resp as any)?.message || '';
        const errCd: string = (resp as any)?.data?.error_cd || '';
        const isSessionExpired =
            respMsg.toLowerCase().includes('session expired') ||
            respMsg.toLowerCase().includes('reconnect') ||
            (resp as any)?.responseCode === '401';
        const isGstr1NotFiled = errCd === 'RT-R3BQ1004';

        let errMsg: string;
        if (isSessionExpired) {
            errMsg = respMsg || 'GST portal session expired. Please reconnect via OTP.';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
        } else if (isGstr1NotFiled) {
            errMsg = 'GSTR-1 not filed for this period. Please file GSTR-1 first.';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
        } else {
            errMsg = respMsg || 'Failed to fetch portal data';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
        }
        setDetailsError(errMsg);
        return false;
    }, [id, role, gstin, financialYear, month, dispatch]);

    const fetchMonths = useCallback(async () => {
        if (!gstin || !financialYear) return;
        setIsLoadingMonths(true);
        const allMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
        const results = await Promise.all(
            allMonths.map(m =>
                getGstr3bFiling({ userId: id, userType: role, gstin, financialYear, month: m })
            )
        );
        setMonths(
            allMonths.map((m, i) => {
                const rec = results[i] as any;
                return { month: m, status: rec?.status === 'filed' ? 'filed' : 'not_started' };
            })
        );
        setIsLoadingMonths(false);
    }, [id, role, gstin, financialYear]);

    useEffect(() => {
        fetchMonths();
    }, [fetchMonths]);

    const loadFilingFromDb = useCallback(async () => {
        if (!gstin || !financialYear || !month) return;
        const record = await getGstr3bFiling({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        // getGstr3bFiling returns resp.data — the DB record or null; false on network error
        if (record) {
            const d = record as any;
            setFiling({
                formData: d.formData ?? null,
                retPeriod: d.retPeriod ?? null,
                autoLiability: d.autoLiability ?? null,
                status: (d.status as Gstr3bFiling['status']) ?? 'draft',
                ackNum: d.ackNum ?? null,
                filedAt: d.filedAt ?? null,
            });
        } else {
            // No DB record for this month — clear any stale filing from a prior month
            setFiling(null);
        }
    }, [id, role, gstin, financialYear, month]);

    const saveToPortal = useCallback(async () => {
        setIsSaving(true);
        // Persist any form edits made in Step 3 to DB before sending to portal
        const currentFormData = filing?.formData;
        if (currentFormData) {
            await updateGstr3bFormData({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                month,
                formData: currentFormData as unknown as Record<string, unknown>,
            });
        }
        const resp = await saveGstr3bToPortal({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        setIsSaving(false);
        if (resp && (resp as any).status) {
            setFiling(prev => (prev ? { ...prev, status: 'saved' } : prev));
            return true;
        }
        const errMsg = (resp as any)?.message || 'Failed to save GSTR-3B';
        dispatch(showToast({ description: errMsg, variant: 'error' }));
        return false;
    }, [id, role, gstin, financialYear, month, dispatch, filing?.formData]);

    const validate = useCallback(async () => {
        setIsValidating(true);
        const resp = await validateGstr3bReturn({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        setIsValidating(false);
        if (resp && (resp as any).status) {
            setFiling(prev => (prev ? { ...prev, status: 'validated' } : prev));
            return true;
        }
        const errMsg = (resp as any)?.message || 'GSTR-3B validation failed';
        dispatch(showToast({ description: errMsg, variant: 'error' }));
        return false;
    }, [id, role, gstin, financialYear, month, dispatch]);

    const fetchLedgers = useCallback(async () => {
        if (!gstin || !financialYear || !month) return false;
        setIsFetchingLedgers(true);
        const resp = await getGstr3bLedgers({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        setIsFetchingLedgers(false);
        if (resp && (resp as any).status) {
            const d = (resp as any).data;
            setLedgers({
                cashLedger: d.cashLedger,
                itcLedger: d.itcLedger,
                liabilityLedger: d.liabilityLedger,
            });
            return true;
        }
        return false;
    }, [id, role, gstin, financialYear, month]);

    const submitOffset = useCallback(
        async (offsetData: Record<string, unknown>) => {
            setIsOffsetting(true);
            const resp = await offsetGstr3bLiability({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                month,
                offsetData,
            });
            setIsOffsetting(false);
            if (resp && (resp as any).status) return true;
            const errMsg = (resp as any)?.message || 'Offset liability failed';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
            return false;
        },
        [id, role, gstin, financialYear, month, dispatch]
    );

    const fetchAutoLiability = useCallback(async () => {
        if (!gstin || !financialYear || !month) return null;
        setIsFetchingAutoLiability(true);
        const resp = await getGstr3bAutoLiability({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        setIsFetchingAutoLiability(false);
        if (resp && (resp as any).status) {
            const autoLiability = (resp as any).data?.autoLiability ?? null;
            setFiling(prev => (prev ? { ...prev, autoLiability } : prev));
            return autoLiability;
        }
        dispatch(
            showToast({
                description: (resp as any)?.message || 'Failed to fetch auto liability',
                variant: 'error',
            })
        );
        return null;
    }, [id, role, gstin, financialYear, month, dispatch]);

    const generateEvcOtp = useCallback(
        async (pan: string) => {
            const resp = await generateGstrEvcOtp({
                userId: id,
                userType: role,
                gstin,
                pan,
                gstrType: 'gstr-3b',
            });
            if (resp && (resp as any).status) return true;
            dispatch(showToast({ description: 'Failed to send EVC OTP', variant: 'error' }));
            return false;
        },
        [id, role, gstin, dispatch]
    );

    const fileReturn = useCallback(
        async (pan: string, otp: string, isNil = false) => {
            setIsFiling(true);
            const resp = await fileGstr3b({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                month,
                pan,
                otp,
                isNil,
            });
            setIsFiling(false);
            if (resp && (resp as any).status) {
                const d = (resp as any).data ?? {};
                const arn =
                    d.ackNum ??
                    d.arn ??
                    d.referenceNumber ??
                    d.arnNumber ??
                    d.ackNo ??
                    d.acknowledgementNumber ??
                    d.refId ??
                    d.refNo ??
                    null;
                const fAt = d.filedAt ?? d.filedDate ?? d.filingDate ?? d.createdAt ?? null;
                setAckNum(arn);
                setFiledAt(fAt);
                setFiling(prev =>
                    prev ? { ...prev, status: 'filed', ackNum: arn, filedAt: fAt } : prev
                );
                return true;
            }
            const errMsg = (resp as any)?.message || 'GSTR-3B filing failed';
            dispatch(showToast({ description: errMsg, variant: 'error' }));
            return false;
        },
        [id, role, gstin, financialYear, month, dispatch]
    );

    const resetFiling = useCallback(() => {
        setFiling(null);
    }, []);

    const updateFormData = useCallback((partial: Partial<Gstr3bFormData>) => {
        setFiling(prev => {
            if (!prev) return prev;
            return { ...prev, formData: { ...(prev.formData as Gstr3bFormData), ...partial } };
        });
    }, []);

    const downloadPdf = useCallback(async () => {
        setIsDownloading(true);
        const resp = await downloadGstr3bPdf({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (resp && resp.buffer) {
            const bytes = new Uint8Array(resp.buffer.data);
            const blob = new Blob([bytes], { type: resp.fileType || 'application/pdf' });
            saveAs(blob, `GSTR-3B-${gstin}-${financialYear}-${month}.pdf`);
        } else {
            dispatch(showToast({ description: 'Failed to download PDF', variant: 'error' }));
        }
        setIsDownloading(false);
    }, [id, role, gstin, financialYear, month, dispatch]);

    return {
        months,
        isLoadingMonths,
        fetchMonths,
        filing,
        isFetchingDetails,
        detailsError,
        isSaving,
        isValidating,
        ledgers,
        isFetchingLedgers,
        isOffsetting,
        isFetchingAutoLiability,
        isFiling,
        isDownloading,
        ackNum,
        filedAt,
        fetchDetails,
        loadFilingFromDb,
        resetFiling,
        saveToPortal,
        validate,
        fetchLedgers,
        submitOffset,
        fetchAutoLiability,
        generateEvcOtp,
        fileReturn,
        updateFormData,
        downloadPdf,
    };
};

export default useGstr3b;
