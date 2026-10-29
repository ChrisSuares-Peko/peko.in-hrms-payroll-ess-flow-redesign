import { useState, useCallback, useEffect } from 'react';

import { capitalize } from 'lodash';

import { useAppSelector } from '@src/hooks/store';
import formatString from '@utils/wordFormat';

import { subscriptionTransactionListing } from '../api/index';
import { subscriptionReportListingResponse, subscriptionTransactionRow } from '../types/index';

export const useSubscriptionApi = (
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
    const [reportRows, setReportRows] = useState<subscriptionTransactionRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [initailLoader, setInitailLoader] = useState(true);
    const [count, setCount] = useState<number>();

    const getReportList = useCallback(async () => {
        setIsLoading(true);
        const data: subscriptionReportListingResponse | false =
            await subscriptionTransactionListing({
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
            const arr = rows?.result?.map(item => {
                const orderResponse = item.orderResponse ? JSON.parse(item.orderResponse) : null;
                const billingType =
                    capitalize(orderResponse?.billingType) ||
                    (item.optional === 'SUBSCRIPTION-ADDONS' ? 'One Time' : '');

                const services = orderResponse?.serviceName || 'N/A';

                return {
                    date: item.transactionDate ?? '',
                    transactionID: item.corporateTxnId ?? '',
                    serviceName: services,
                    // serviceName: item.serviceName ?? '',
                    amount: item.baseAmount ?? '',
                    paymentMode: item.paymentInstrument || formatString(item.paymentMode),
                    status: formatString(item.status) ?? '',
                    billingType: billingType ?? 'N/A',
                    download: 'Download invoice',
                    cashback: item.corporateCashback ?? '',
                    accountNumber: '',
                    subCorporateName: item.subCorporateUser?.name ?? '',
                    isInvoice: item.isInvoice ?? false,
                };
            });

            setCount(rows.totalData);

            setReportRows(arr);
            setIsLoading(false);
            // if (initailLoader) setInitailLoader(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, category, searchText, sort, page, itemsPerPage, filter, sortField]);
    useEffect(() => {
        getReportList();
    }, [getReportList]);
    return {
        subscriptionData: reportRows,
        subscriptionCount: count,
        subscriptionLoading: isLoading,
    };
};
