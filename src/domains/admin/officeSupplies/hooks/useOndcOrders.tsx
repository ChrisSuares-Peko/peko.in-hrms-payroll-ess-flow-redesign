import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllOndcOrders, getFileBufferReportOndcOrders, getOndcOrderSellers } from '../api/order';
import { AllOrdersRow, allOrdersResponse } from '../types/types';

type OndcOrdersFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    from: string;
    to: string;
    sort: string;
    sortField: string;
    status?: string;
    sellerName?: string;
    needsAttention?: boolean;
    /** Only orders past their delivery promise and still undelivered. */
    delayedOnly?: boolean;
};

/** "All orders" tab — real ONDC order rows, every state. Mirrors useOrders.tsx's shape. */
const useOndcOrders = (payload: OndcOrdersFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<AllOrdersRow[]>();
    const [sellerOptions, setSellerOptions] = useState<string[]>([]);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: allOrdersResponse | false = await getAllOndcOrders({
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

    const getSellerOptions = useCallback(async () => {
        const data: string[] | false = await getOndcOrderSellers({ userId: id, userType: role });
        if (data) setSellerOptions(data);
    }, [id, role]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportOndcOrders({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, `Orders.xlsx`);
            else if (type === 'csv') saveAs(blob, `Orders.csv`);
            else if (type === 'pdf') saveAs(blob, `Orders.pdf`);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    useEffect(() => {
        getSellerOptions();
    }, [getSellerOptions]);

    return { isLoading, tableData, count, sellerOptions, getAllTableData, downloadReport };
};

export default useOndcOrders;
