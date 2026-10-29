import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllPaymentLinksOrders, getFileBufferReport } from '../api/paymentLinks';
import { getData } from '../types/index';
import { PaymentLinkOrder, AllPaymentLinkOrderResponse } from '../types/paymentLinks';

const usePaymentLinks = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<PaymentLinkOrder[]>();

    const getAllPaymentLinkReport = useCallback(async () => {
        setIsLoading(true);
        const data: AllPaymentLinkOrderResponse | false = await getAllPaymentLinksOrders({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, payload, role]);

    useEffect(() => {
        getAllPaymentLinkReport();
    }, [getAllPaymentLinkReport]);

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
                saveAs(blob, `Payment Links Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Payment Links Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Payment Links Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, downloadReport };
};

export default usePaymentLinks;
