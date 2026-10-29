import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';
import formatString from '@utils/wordFormat';

import { CashbackListing } from '../api/index';
import { reportListingResponse, transactionType } from '../types/index';

export const useGetCashbackData = (
    searchText: string,
    category: string,
    sort: string,
    page: number,
    itemsPerPage: number,
    filter: string,
    from: string,
    to: string,
    sortField: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [reportRows, setReportRows] = useState<transactionType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();

    const getReportList = useCallback(async () => {
        setIsLoading(true);
        const data: reportListingResponse | false = await CashbackListing({
            userId: id,
            userType: role,
            from,
            to,
            categoryName: category,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
            sortField,
        });

        if (data) {
            const rows = data;

            const arr = rows?.result
                ?.filter(item => Number(item.corporateCashback) > 0) // Data filetered where corporateCashback is zero or less
                ?.map(item => ({
                    date: item.transactionDate ?? '',
                    transactionID: item.corporateTxnId ?? '',
                    category: item.transactionCategory ?? '',
                    operator: item.serviceOperator?.serviceProvider ?? (item.order?.orderResponse ? (JSON.parse(item.order.orderResponse)?.serviceName ?? '') : ''),
                    amount: item.order.amountInINR ?? '',
                    paymentMode: formatString(item.order.paymentMode) ?? '',
                    cashback: item.corporateCashback ?? '',
                    status: formatString(item.order.status) ?? '',
                    download: 'Download invoice',
                    accountNumber: item.order.accountNo ?? '',
                    subCorporateName: item.order?.subCorporateUser?.name ?? '',
                    isInvoice: item.isInvoice ?? false,
                }));
            setCount(rows.totalData);
            setReportRows(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, category, filter, from, itemsPerPage, page, searchText, to, sort, sortField]);
    useEffect(() => {
        getReportList();
    }, [getReportList]);
    return { cashbackdata: reportRows, cashbackCount: count, cashbackLoading: isLoading };
};
