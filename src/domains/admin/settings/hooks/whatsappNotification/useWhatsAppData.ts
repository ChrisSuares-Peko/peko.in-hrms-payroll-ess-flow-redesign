import { useState, useEffect, useCallback } from 'react';

import saveAs from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, getFileBufferWhatsAppNumber } from '../../api/whasappNotification';
import { getData, numbers } from '../../types/whatsappNotification'; // Import types as needed

const useWhatsAppData = (initialPayload: getData) => {
    const dispatch = useAppDispatch();
    const [whatsappNumbers, setWhatsappNumbers] = useState<numbers[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Function to fetch data from the API
    const fetchWhatsAppNumbers = useCallback(async (payload: getData) => {
        setIsLoading(true);
        const data = await getAllData(payload);
        if (data) {
            const sortedNumbers = [...data.numbers].reverse();
            setWhatsappNumbers(sortedNumbers);
            setTotalCount(data.totalCount);
        }

        setIsLoading(false);
    }, []);
    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferWhatsAppNumber({
            // userId: id,
            // userType: role,
            type,
            searchText: initialPayload.searchText,
            // partnerId,
            page: initialPayload.page,
            itemsPerPage: initialPayload.itemsPerPage,
            // to,
            // from,
        });
        if (data === false) {
            dispatch(
                showToast({
                    description: 'No data is available for export.',
                    variant: 'error',
                })
            );
        }
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Peko WhatsApp Numbers.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Peko WhatsApp Numbers.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Peko WhatsApp Numbers.pdf`);
            }
        }
        setIsLoading(false);
    };
    // UseEffect to initially fetch data
    useEffect(() => {
        fetchWhatsAppNumbers(initialPayload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        whatsappNumbers,
        totalCount,
        isLoading,
        fetchWhatsAppNumbers,
        downloadReport,
    };
};

export default useWhatsAppData;
