import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getEsimOrder, getFileBufferReport } from '../api/esim';
import { esimReportResponse, OrderItem } from '../types/esim';
import { getData } from '../types/index';

const useGetEsimOrders = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<OrderItem[]>();

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: esimReportResponse | false = await getEsimOrder({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            // const arr = data.result.map(item => {
            //     const orderResponse = JSON.parse(item.order.orderResponse);
            //     return {
            //         id: item.order?.id,
            //         corporateTxnId: item.order?.corporateTxnId || '-',
            //         date: item.order.transactionDate,
            //         plan: orderResponse?.package || '-',
            //         retailPrice: orderResponse?.price,
            //         netPrice: orderResponse?.net_price,
            //         amount: item.order.amountInINR,
            //         paymentType: item.order.paymentMode || '-',
            //         customerName: item.credential.name,
            //         customerId: item.credential.username,
            //         quantity: orderResponse?.quantity || '-',
            //         purchaseType: item.order.providerId,
            //         status: item.order.status,
            //     };
            // });
            setTableData(data.result);
            setCount(data.totalData);
        }
        setIsLoading(false);
    }, [id, payload, role]);
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `eSIM Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `eSIM Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `eSIM Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, downloadReport };
};

export default useGetEsimOrders;
