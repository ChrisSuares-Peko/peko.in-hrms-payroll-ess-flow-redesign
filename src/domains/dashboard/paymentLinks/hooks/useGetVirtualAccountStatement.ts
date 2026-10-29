import { useCallback, useEffect, useState } from 'react';

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { getVirtualAccountStatement } from '../api';
import type {
    VirtualAccountAccountDetails,
    VirtualAccountStatementApiRow,
    VirtualAccountStatementSummaryApi,
} from '../types/paymentLinkTypes';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export default function useGetVirtualAccountStatement() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [accountDetails, setAccountDetails] = useState<VirtualAccountAccountDetails | null>(null);
    const [summary, setSummary] = useState<VirtualAccountStatementSummaryApi | null>(null);
    const [rows, setRows] = useState<VirtualAccountStatementApiRow[]>([]);
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().subtract(30, 'day').startOf('day'),
        dayjs().endOf('day'),
    ]);

    const fetchStatement = useCallback(async () => {
        setIsLoading(true);
        const [from, to] = dateRange;
        const data = await getVirtualAccountStatement({
            userId: id,
            userType: role,
            from: from.format(DATETIME_FORMAT),
            to: to.format(DATETIME_FORMAT),
            page,
        });
        setIsLoading(false);

        if (data) {
            setAccountDetails(data.accountDetails);
            setSummary(data.summary);
            setRows(data.statement.rows);
        }
    }, [id, role, page, dateRange]);

    useEffect(() => {
        fetchStatement();
    }, [fetchStatement]);

    return {
        isLoading,
        accountDetails,
        summary,
        rows,
        page,
        setPage,
        dateRange,
        setDateRange,
        fetchStatement,
    };
}
