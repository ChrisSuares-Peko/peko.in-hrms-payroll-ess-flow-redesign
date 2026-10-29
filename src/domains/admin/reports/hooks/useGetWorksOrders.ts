import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, getFileBufferReport } from '../api/works';
import { getData } from '../types/index';
import { OrdersInfo, transactionResponse } from '../types/works';

const useGetWorksOrders = (payload: getData, additionalFilters: any) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<OrdersInfo[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: transactionResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
            ...additionalFilters,
        });
        if (data) {
            const ordersData = data as transactionResponse;
            // const arr: WorkOrderTableItems[] = ordersData?.result?.map(item => {
            //     const orderResponse = JSON.parse(item.order.orderResponse);
            //     return {
            //         id: item?.order?.id,
            //         transactionDate: item?.order?.transactionDate,
            //         corporateTxnId: item?.order?.corporateTxnId,
            //         amount: item?.order?.amountInINR,
            //         paymentMode: item?.order?.paymentMode,
            //         status: item?.order?.workspaceOrderStatus,
            //         corporateName: item?.credential?.name,
            //         corporateUserName: item?.credential?.username,
            //         workName: orderResponse?.planDetails?.work?.name,
            //         planName: orderResponse?.planDetails?.name,
            //         pocName: orderResponse?.pocName,
            //         email: orderResponse?.email,
            //         requirement: orderResponse?.requirement,
            //     };
            // });
            setTableData(ordersData.result);
            setCount(data.totalData);
        }
        setIsLoading(false);
    }, [id, payload, additionalFilters, role]);
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
            ...additionalFilters,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Peko Works Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Peko Works Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Peko Works Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, getAllTableData, downloadReport };
};

export default useGetWorksOrders;
