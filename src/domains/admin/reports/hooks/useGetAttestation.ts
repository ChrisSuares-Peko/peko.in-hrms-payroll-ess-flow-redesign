import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllData, updateDocument, getFileBufferReport } from '../api/attestation';
import { getData } from '../types';
import { DocumentEdit, docAttestation, docAttestationData } from '../types/attestation';

const useGetAttestation = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, SetRefresh] = useState(false);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<docAttestation[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: docAttestationData | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    const updateDocumentAttestation = useCallback(
        async (payloadData: DocumentEdit) => {
            setIsLoading(true);
            const data: docAttestation | false = await updateDocument({
                userId: id,
                userType: role,
                ...payloadData,
            });
            if (data) {
                SetRefresh(true);
                return true;
            }
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData, refresh]);

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
                saveAs(blob, `Attestations Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Attestations Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Attestations Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return { isLoading, tableData, count, updateDocumentAttestation, downloadReport };
};

export default useGetAttestation;
