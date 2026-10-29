import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getGstr2bData, getGstr2bReconciliationStatus, markGstr2bReconciled } from '../api/tax';
import type { Gstr2bItcSummary } from '../types';
import {
    mapB2baRows,
    mapB2bRows,
    mapCdnRows,
    mapImpgRows,
    mapIsdRows,
    mapTcsRows,
    mapTdsRows,
} from '../utils/gstr2bMappers';
import type {
    Gstr2bB2baRow,
    Gstr2bCdnRow,
    Gstr2bImpgRow,
    Gstr2bIsdRow,
    Gstr2bRow,
    Gstr2bTcsRow,
    Gstr2bTdsRow,
} from '../utils/gstr2bTypes';

interface Gstr2bParams {
    gstin: string;
    financialYear: string;
    month: number;
}

const useGstr2bData = (params: Gstr2bParams | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);

    const [b2bRows, setB2bRows] = useState<Gstr2bRow[]>([]);
    const [b2baRows, setB2baRows] = useState<Gstr2bB2baRow[]>([]);
    const [cdnRows, setCdnRows] = useState<Gstr2bCdnRow[]>([]);
    const [impgRows, setImpgRows] = useState<Gstr2bImpgRow[]>([]);
    const [isdRows, setIsdRows] = useState<Gstr2bIsdRow[]>([]);
    const [tdsRows, setTdsRows] = useState<Gstr2bTdsRow[]>([]);
    const [tcsRows, setTcsRows] = useState<Gstr2bTcsRow[]>([]);
    const [itcSummary, setItcSummary] = useState<Gstr2bItcSummary | null>(null);
    const [itcAvailable, setItcAvailable] = useState<number | undefined>(undefined);
    const [itcNotAvailable, setItcNotAvailable] = useState<number | undefined>(undefined);
    const [generatedDate, setGeneratedDate] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [requiresAuth, setRequiresAuth] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [isReconciled, setIsReconciled] = useState<boolean | null>(null);

    const fetchData = useCallback(async (): Promise<boolean> => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return false;
        setIsLoading(true);
        const resp = await getGstr2bData({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) {
            const { data } = resp;
            setB2bRows(mapB2bRows(data.b2b));
            setB2baRows(mapB2baRows(data.b2ba));
            setCdnRows(mapCdnRows(data.cdn));
            setImpgRows(mapImpgRows(data.impg));
            setIsdRows(mapIsdRows(data.isd));
            setTdsRows(mapTdsRows(data.tds));
            setTcsRows(mapTcsRows(data.tcs));
            setItcSummary(data.itcSummary);
            setItcAvailable(data.itcAvailable);
            setItcNotAvailable(data.itcNotAvailable);
            setGeneratedDate(data.generatedDate);
            setRequiresAuth(false);
            setHasData(true);
            setIsLoading(false);
            return true;
        }
        if (resp && !resp.status) {
            const d = resp.data as unknown as { requiresAuth?: boolean };
            setRequiresAuth(d?.requiresAuth === true);
        }
        setIsLoading(false);
        return false;
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    const fetchReconStatus = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        const resp = await getGstr2bReconciliationStatus({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) setIsReconciled(resp.data.reconciled);
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    useEffect(() => {
        setIsReconciled(null);
        if (params?.gstin && params?.financialYear && params?.month) fetchReconStatus();
    }, [params?.gstin, params?.financialYear, params?.month]); // eslint-disable-line react-hooks/exhaustive-deps

    const markReconciled = useCallback(async (): Promise<boolean> => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return false;
        const resp = await markGstr2bReconciled({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) {
            setIsReconciled(true);
            return true;
        }
        return false;
    }, [id, role, params?.gstin, params?.financialYear, params?.month]);

    return {
        b2bRows,
        b2baRows,
        cdnRows,
        impgRows,
        isdRows,
        tdsRows,
        tcsRows,
        itcSummary,
        itcAvailable,
        itcNotAvailable,
        generatedDate,
        isLoading,
        requiresAuth,
        hasData,
        isReconciled,
        fetch: fetchData,
        fetchReconStatus,
        markReconciled,
    };
};

export default useGstr2bData;
