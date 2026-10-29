import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    fileGstr1,
    getGstr1Months,
    getGstr1PortalSummary,
    getGstr1Summary,
    markGstr1Filed,
    resetGstr1,
    saveGstr1ToPortal,
} from '../api/tax';
import { Gstr1Amendments, Gstr1MonthStatus, Gstr1PortalSummary, Gstr1Summary } from '../types';

const EMPTY_SECTION = {
    count: 0,
    taxableAmount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    totalTax: 0,
    invoices: [],
};

const EMPTY_AMEND_SECTION = {
    count: 0,
    taxableAmount: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    totalTax: 0,
    invoices: [],
};
const EMPTY_AMENDMENTS: Gstr1Amendments = {
    b2ba: EMPTY_AMEND_SECTION,
    b2cla: EMPTY_AMEND_SECTION,
    b2csa: EMPTY_AMEND_SECTION,
    cdnra: EMPTY_AMEND_SECTION,
    cdnura: EMPTY_AMEND_SECTION,
    expa: EMPTY_AMEND_SECTION,
};

const EMPTY_SUMMARY: Gstr1Summary = {
    b2b: EMPTY_SECTION,
    b2c: EMPTY_SECTION,
    b2cSmall: EMPTY_SECTION,
    export: EMPTY_SECTION,
    cdn: EMPTY_SECTION,
    cdnr: EMPTY_SECTION,
    cdnur: EMPTY_SECTION,
    nil: EMPTY_SECTION,
    advance: EMPTY_SECTION,
    total: EMPTY_SECTION,
    hsn: [],
    documents: [],
    amendments: EMPTY_AMENDMENTS,
};

const useGstr1 = (gstin: string, financialYear: string, month: number) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [months, setMonths] = useState<Gstr1MonthStatus[]>([]);
    const [summary, setSummary] = useState<Gstr1Summary>(EMPTY_SUMMARY);
    const [isLoadingMonths, setIsLoadingMonths] = useState(false);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [isFiling, setIsFiling] = useState(false);
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [portalSummary, setPortalSummary] = useState<Gstr1PortalSummary | null>(null);
    const [ackNum, setAckNum] = useState<string | null>(null);
    const [isSavingToPortal, setIsSavingToPortal] = useState(false);
    const [isFetchingSummary, setIsFetchingSummary] = useState(false);
    const [portalSummaryError, setPortalSummaryError] = useState(false);
    const [isFilingPortal, setIsFilingPortal] = useState(false);

    const fetchMonths = useCallback(async () => {
        if (!gstin || !financialYear) return;
        setMonths([]);
        setIsLoadingMonths(true);
        const data = await getGstr1Months({ userId: id, userType: role, gstin, financialYear });
        if (data) setMonths(data as Gstr1MonthStatus[]);
        setIsLoadingMonths(false);
    }, [id, role, gstin, financialYear]);

    const summaryKeyRef = useRef<string | null>(null);
    const fetchSummary = useCallback(async () => {
        if (!gstin || !financialYear || !month) return;
        const key = `${gstin}|${financialYear}|${month}`;
        if (summaryKeyRef.current !== key) {
            summaryKeyRef.current = key;
            setSummary(EMPTY_SUMMARY);
        }
        setIsLoadingSummary(true);
        const data = await getGstr1Summary({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (data) setSummary(data as Gstr1Summary);
        setIsLoadingSummary(false);
    }, [id, role, gstin, financialYear, month]);

    const fileFn = useCallback(async () => {
        setIsFiling(true);
        const resp = await markGstr1Filed({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (resp && (resp as any).status) {
            dispatch(showToast({ description: 'Invoices marked as filed', variant: 'success' }));
            await fetchSummary();
            setIsFiling(false);
            return true;
        }
        setIsFiling(false);
        return false;
    }, [id, role, gstin, financialYear, month, dispatch, fetchSummary]);

    const saveToPortal = useCallback(async () => {
        setIsSavingToPortal(true);
        const resp = await saveGstr1ToPortal({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (resp && (resp as any).data?.referenceId) setReferenceId((resp as any).data.referenceId);
        setIsSavingToPortal(false);
        return resp ? ((resp as any).data?.referenceId ?? null) : null;
    }, [id, role, gstin, financialYear, month]);

    const fetchPortalSummary = useCallback(async () => {
        setIsFetchingSummary(true);
        setPortalSummaryError(false);
        const data = await getGstr1PortalSummary({
            userId: id,
            userType: role,
            gstin,
            financialYear,
            month,
        });
        if (data && (data as Gstr1PortalSummary).chksum) {
            setPortalSummary(data as Gstr1PortalSummary);
        } else {
            setPortalSummaryError(true);
        }
        setIsFetchingSummary(false);
    }, [id, role, gstin, financialYear, month]);

    const fileReturn = useCallback(
        async (
            pan: string,
            otp: string
        ): Promise<{ ackNum: string | null; error: string | null }> => {
            setIsFilingPortal(true);
            const resp = await fileGstr1({
                userId: id,
                userType: role,
                gstin,
                financialYear,
                month,
                pan,
                otp,
            });
            setIsFilingPortal(false);
            if (resp && (resp as any).data?.ackNum) {
                setAckNum((resp as any).data.ackNum);
                return { ackNum: (resp as any).data.ackNum, error: null };
            }
            const errMsg: string =
                (resp as any)?.message ||
                (resp as any)?.data?.raw?.error?.message ||
                'Failed to file return. Please try again.';
            return { ackNum: null, error: errMsg };
        },
        [id, role, gstin, financialYear, month]
    );

    const resetReturn = useCallback(async () => {
        const resp = await resetGstr1({ userId: id, userType: role, gstin, financialYear, month });
        if (resp && (resp as any).status) {
            setAckNum(null);
            await fetchMonths();
            return { ok: true, refId: (resp as any).data?.refId ?? null };
        }
        return { ok: false, refId: null };
    }, [id, role, gstin, financialYear, month, fetchMonths]);

    useEffect(() => {
        fetchMonths();
    }, [fetchMonths]);
    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return {
        months,
        summary,
        isLoadingMonths,
        isLoadingSummary,
        isFiling,
        fileFn,
        refreshSummary: fetchSummary,
        referenceId,
        portalSummary,
        ackNum,
        isSavingToPortal,
        isFetchingSummary,
        portalSummaryError,
        isFilingPortal,
        saveToPortal,
        fetchPortalSummary,
        fileReturn,
        resetReturn,
    };
};

export default useGstr1;
