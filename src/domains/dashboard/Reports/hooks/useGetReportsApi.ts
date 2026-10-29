import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';
import formatString from '@utils/wordFormat';

import { reportListing } from '../api/index';
import { reportListingResponse, transactionType } from '../types/index';

export const useGetReportsApi = (
    searchText: string,
    category: string,
    sort: string,
    page: number,
    itemsPerPage: number,
    filter: string,
    from: string,
    to: string,
    sortField: string,
    accessKey?: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [reportRows, setReportRows] = useState<transactionType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [initailLoader, setInitailLoader] = useState(true);
    const [count, setCount] = useState<number>();

    const getReportList = useCallback(async () => {
        setIsLoading(true);
        const data: reportListingResponse | false = await reportListing({
            userId: id,
            userType: role,
            from,
            to,
            categoryName: category,
            accessKey,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
            sortField,
        });

        if (data) {
            const rows = data;

            const arr = rows?.result?.map(item => ({
                date: item.transactionDate ?? '',
                transactionID: item.corporateTxnId ?? '',
                category: item.transactionCategory ?? '',
                operator:
                    item.serviceOperator?.serviceProvider ??
                    (item.order?.orderResponse
                        ? (JSON.parse(item.order.orderResponse)?.serviceName ?? '')
                        : ''),
                amount: item.order.amountInINR ?? '',
                paymentMode: item.order.paymentInstrument || formatString(item.order.paymentMode),
                status: formatString(item.order.status) ?? '',
                download: 'Download invoice',
                cashback: item.corporateCashback ?? '',
                accountNumber: item.order.accountNo ?? '',
                subCorporateName: item.order?.subCorporateUser?.name ?? '',
                isInvoice: item.isInvoice ?? false,
            }));

            setCount(rows.totalData);

            setReportRows(arr);
            setIsLoading(false);
            if (initailLoader) setInitailLoader(false);
        } else {
            setIsLoading(false);
        }
    }, [
        id,
        role,
        from,
        to,
        category,
        accessKey,
        searchText,
        sort,
        page,
        itemsPerPage,
        filter,
        initailLoader,
        sortField,
    ]);
    useEffect(() => {
        getReportList();
    }, [getReportList]);
    return { orderData: reportRows, orderCount: count, orderLoading: isLoading, initailLoader };
};
