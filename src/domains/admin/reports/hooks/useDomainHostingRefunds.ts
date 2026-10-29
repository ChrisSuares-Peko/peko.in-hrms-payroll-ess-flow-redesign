import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllDomainHostingRefunds, getDomainHostingRefundsFileBuffer, processDomainHostingRefund } from '../api/domainHostingRefunds';
import { DomainHostingRefund, AllDomainHostingRefundsResponse } from '../types/domainHostingRefunds';
import { getData } from '../types/index';

const useDomainHostingRefunds = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<DomainHostingRefund[]>([]);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: AllDomainHostingRefundsResponse | false = await getAllDomainHostingRefunds({
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
        getAllTableData();
    }, [getAllTableData]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getDomainHostingRefundsFileBuffer({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: data.fileType });
            if (type === 'excel') saveAs(blob, 'Domain & Hosting Refunds Report.xlsx');
            else if (type === 'csv') saveAs(blob, 'Domain & Hosting Refunds Report.csv');
            else if (type === 'pdf') saveAs(blob, 'Domain & Hosting Refunds Report.pdf');
        }
        setIsLoading(false);
    };

    const refundOrder = async (refundPayload: { corporateTxnId: string; refundAmount: number; remarks: string }): Promise<boolean> => {
        setModalLoading(true);
        const result = await processDomainHostingRefund({ userId: id, userType: role, ...refundPayload });
        setModalLoading(false);
        return !!result;
    };

    return { isLoading, modalLoading, tableData, count, downloadReport, getAllTableData, refundOrder };
};

export default useDomainHostingRefunds;
