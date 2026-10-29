import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteCode,
    getAllData,
    getFileBufferReport,
    getGeneralReferralReport,
    getReferralReports,
    getRefferalReport,
    updateCurrentStatus,
} from '../api/refferalCode';
import {
    ReferalResponse,
    Referral,
    activeResponse,
    getData,
    updateStatus,
} from '../types/refferalCode';

const useGetRefaralCodes = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [refCount, setRefCount] = useState<number>(0);
    const [tableData, setTableData] = useState<Referral[]>();
    const [referralPartnerId, setReferralPartnerId] = useState<number | undefined>(undefined);
    const dispatch = useDispatch();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: ReferalResponse | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, payload]);

    const fetchReferralReports = useCallback(
        async ({
            fromDate,
            toDate,
            partnerId,
            referralCode,
        }: {
            fromDate: string;
            toDate: string;
            partnerId?: number | undefined;
            referralCode: string;
        }) => {
            setIsLoading(true);
            if (partnerId !== undefined) {
                setReferralPartnerId(partnerId); // Set the partnerId in state
            }
            const response = await getReferralReports({
                userId: id,
                userType: role,
                fromDate,
                toDate,
                partnerId,
                referralCode,
            });
            if (response) {
                setRefCount(response.count);
            }

            setIsLoading(false);
        },
        [id, role]
    );

    const fetchGeneralReferralReports = async ({
        fromDate,
        toDate,
        PartnerId,
    }: {
        fromDate: string;
        toDate: string;
        PartnerId?: number | string;
    }) => {
        setIsLoading(true);
        if (!PartnerId) {
            PartnerId = '';
        }
        if (PartnerId === 'default') {
            PartnerId = 'default';
        }
        // fetchReferralReports({fromDate, toDate, partnerId: referralPartnerId})
        const data: CommonFileBuffer | false = await getGeneralReferralReport(
            {
                userId: id,
                userType: role,
                ...payload,
            },
            fromDate,
            toDate,
            PartnerId
        );
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            saveAs(blob, `Referral report.xlsx`);
        }
        setIsLoading(false);
    };

    const updateActiveStatus = useCallback(
        async ({ referalId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await updateCurrentStatus({
                userId: id,
                userType: role,
                referalId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (referalId: number) => {
            setIsLoading(true);
            const data: activeResponse | false = await deleteCode({
                userId: id,
                userType: role,
                id: referalId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `Referral code deleted successfully `,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
        },
        [dispatch, id, role]
    );

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
                saveAs(blob, `Referral Code.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Referral Code.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Referral Code.pdf`);
            }
        }
        setIsLoading(false);
    };

    const downloadRefReport = async ({
        fromDate,
        toDate,
        referralCode,
    }: {
        fromDate: string;
        toDate: string;
        referralCode: string;
    }) => {
        setIsLoading(true);
        // fetchReferralReports({fromDate, toDate, partnerId: referralPartnerId})
        const data: CommonFileBuffer | false = await getRefferalReport(
            {
                userId: id,
                userType: role,
                ...payload,
            },
            fromDate,
            toDate,
            referralPartnerId,
            referralCode
        );
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            saveAs(blob, `Referral report.xlsx`);
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        refCount,
        downloadReport,
        downloadRefReport,
        fetchReferralReports,
        fetchGeneralReferralReports,
    };
};

export default useGetRefaralCodes;
