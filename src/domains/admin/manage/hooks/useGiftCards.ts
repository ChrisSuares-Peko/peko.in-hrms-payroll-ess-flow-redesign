import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, commonSelectType } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import {
    getFileBufferReport,
    getGiftCardsData,
    updateGiftCardsStatus,
    vendorsListing,
} from '../api/giftCards';
import {
    ApiResponseGiftCards,
    GiftCardsBody,
    IVendorsListingResponse,
    getGiftCards,
    updateGiftCardsStatusPayload,
} from '../types/giftCards';

const useGiftCardsData = ({ searchText, itemsPerPage, page, sort, sortField }: getGiftCards) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<GiftCardsBody[]>();
    const [vendorData, setVendorData] = useState<commonSelectType[]>([
        {
            oName: '',
            oValue: '',
        },
    ]);

    const handleRefresh = () => {
        SetRefresh(prev => !prev);
    };

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseGiftCards | false = await getGiftCardsData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, itemsPerPage, page, role, searchText, sort, refresh, sortField]);

    const getVendors = useCallback(async () => {
        const data: IVendorsListingResponse | false = await vendorsListing({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data?.data?.map(item => ({
                oName: item.serviceProvider ?? '',
                oValue: item.id ?? '',
            }));
            setVendorData(arr);
        }
    }, [id, role]);

    const updateActiveStatus = useCallback(
        async ({ giftCardId, status }: updateGiftCardsStatusPayload) => {
            setIsLoading(true);
            const data: {} | false = await updateGiftCardsStatus({
                userId: id,
                userType: role,
                giftCardId,
                status,
            });
            setIsLoading(false);
            if (data) {
                handleRefresh();
            }
        },
        [id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReport({
            userId: id,
            userType: role,
            type,
            searchText,
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Gift Cards.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Gift Cards.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Gift Cards.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    useEffect(() => {
        getVendors();
    }, [getVendors]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        handleRefresh,
        vendorData,
        downloadReport,
    };
};

export default useGiftCardsData;
