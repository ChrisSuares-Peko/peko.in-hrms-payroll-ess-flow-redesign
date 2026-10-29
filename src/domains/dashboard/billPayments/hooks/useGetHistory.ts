import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllTransaction } from '../api/index';

export default function useOrderHistoryApi({
    searchText,
    category,
    sort,
    page,
    itemsPerPage,
    filter,
    from,
    to,
    sortField,
}: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<any>([]);
    const [count, setCount] = useState<number>(1);
    const getHistory = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllTransaction({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            sort,
            page,
            itemsPerPage,
            filter,
            sortField,
        });

        if (data) {
            const transformedData = data.result.map((item: any) => {
                const orderResponse = JSON.parse(item.order.orderResponse);
                return {
                    corporateTxnId: item.order.corporateTxnId,
                    createdAt: item.order.transactionDate,
                    bbpsSupportHistory: {
                        complaintId: item.order.id, // Assuming Order ID as Complaint ID
                        requestBody: {
                            txnRefId: orderResponse.txnRefId || 'N/A',
                        },
                    },
                    mobileNumber: orderResponse?.inputParams?.input?.paramValue || '-',
                    category: item.serviceOperator.serviceProvider,
                    Operator: item.serviceOperator.serviceProvider,
                    amount: item.order.amountInINR || '-',
                    status: item.order.status,
                };
            });

            setHistory(transformedData);
            setCount(data.totalData);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, from, to, searchText, sort, page, itemsPerPage, filter, sortField]);
    useEffect(() => {
        getHistory();
    }, [getHistory]);

    return { isLoading, history, count };
}
