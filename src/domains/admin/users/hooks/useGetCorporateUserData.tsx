import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer, DropDown } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addNewCorporateUser,
    getCorporateUserData,
    getKycStatus,
    getPackages,
    getUpdateStatus,
    updateUserData,
    getFileBufferReportCorporate,
} from '../api/index';
import {
    AddNewCorporate,
    ApiResponse,
    Data,
    activeResponse,
    getCorporateUsers,
    kycResponse,
    packagesResponse,
    packagesTypes,
    updateData,
    updateStatus,
} from '../types/corporateUserTypes';

const useGetCorporateUserData = ({
    searchText,
    itemsPerPage,
    page,
    partnerId,
    sort,
    sortField,
    to,
    from,
}: getCorporateUsers) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, SetRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Data[]>();
    const [kyc, setKyc] = useState<DropDown>();
    const [packageData, setPackageData] = useState<DropDown>();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponse | false = await getCorporateUserData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            partnerId,
            sort,
            sortField,
            to,
            from,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        SetRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, partnerId, role, searchText, sort, sortField, to, from]);

    const updateActiveStatus = useCallback(
        async ({ corporateId, isActive }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                corporateId,
                isActive,
            });
            if (data) {
                SetRefresh(true);
            }
        },
        [id, role]
    );
    const kycDetails = useCallback(async () => {
        setIsLoading(true);
        const data: kycResponse | false = await getKycStatus({
            userId: id,
            userType: role,
        });
        if (data) {
            setKyc(data.kycType);
        }
    }, [id, role]);
    const packageDetails = useCallback(async () => {
        const data: packagesResponse | false = await getPackages({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.data.map((item: packagesTypes) => ({
                value: item.id.toString(),
                label: item.packageName,
            }));
            setPackageData(arr);
        }
    }, [id, role]);

    const updateCorporateUserData = useCallback(
        async (payload: updateData) => {
            setIsLoading(true);
            const data: activeResponse | false = await updateUserData({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                SetRefresh(true);
                setIsLoading(false);
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportCorporate({
            userId: id,
            userType: role,
            type,
            searchText,
            partnerId,
            page,
            itemsPerPage,
            to,
            from,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Corporate Users.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Corporate Users.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Corporate Users.pdf`);
            }
        }
        setIsLoading(false);
    };
    const addNewCorporate = async (values: AddNewCorporate) => {
        setIsLoading(true);
        const data: any = await addNewCorporateUser({
            ...values,
        });
        if (data) {
            dispatch(
                showToast({ description: 'Corporate added successfully', variant: 'success' })
            );
               SetRefresh(true);
            setIsLoading(false);
            return true;
        }
        
        setIsLoading(false);
        return false;
    };
    useEffect(() => {
        getData();
    }, [getData, refresh]);

    useEffect(() => {
        kycDetails();
        packageDetails();
    }, [kycDetails, packageDetails]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        updateCorporateUserData,
        kycStatus: kyc,
        packageData,
        downloadReport,
        addNewCorporate,
        SetRefresh,
    };
};

export default useGetCorporateUserData;
