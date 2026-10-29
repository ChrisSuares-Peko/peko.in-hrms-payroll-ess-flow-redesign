import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createAttestationCategory,
    deleteAttestationCategory,
    getAllAttestationCategories,
    getAttestationCategoryReport,
    updateAttestationCategory,
} from '../api/attestationCategory';
import {
    activeResponse,
    AttestationCategoryData,
    AttestationCategoryResponse,
    createCategoryPayload,
    getAttestationCategoriesPayload,
    updateCategoryPayload,
} from '../types/attestationTypes';

const useGetAttestationCategories = ({
    searchText,
    from,
    to,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getAttestationCategoriesPayload) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<AttestationCategoryData[]>();

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: AttestationCategoryResponse | false = await getAllAttestationCategories({
            userId: id,
            userType: role,
            searchText,
            from,
            to,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, searchText, from, to, itemsPerPage, page, sort, sortField, role]);

    const deleteCategory = useCallback(
        async (categoryId: number) => {
            setIsLoading(true);
            const data: activeResponse | false = await deleteAttestationCategory({
                userId: id,
                userType: role,
                categoryId,
            });
            const { message } = data as any;
            setIsLoading(false);
            if (data) {
                dispatch(
                    showToast({
                        description: `${message}`,
                        variant: 'success',
                    })
                );
                return data;
            }
            return false;
        },
        [id, role, dispatch]
    );

    const createCategory = useCallback(
        async (categoryPayload: createCategoryPayload) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<AttestationCategoryData> | false =
                await createAttestationCategory({
                    userId: id,
                    userType: role,
                    ...categoryPayload,
                });
            setIsLoading(false);
            if (data) {
                return data;
            }
            return false;
        },
        [id, role]
    );
    const updateCategory = useCallback(
        async (categoryPayload: updateCategoryPayload) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<AttestationCategoryData> | false =
                await updateAttestationCategory({
                    userId: id,
                    userType: role,
                    ...categoryPayload,
                });

            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const downloadReport = async (type: 'excel' | 'csv' | 'pdf') => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getAttestationCategoryReport({
            userId: id,
            userType: role,
            type,
            searchText,
            from,
            to,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Document Attestations.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Document Attestations.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Document Attestations.pdf`);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateCategory,
        deleteCategory,
        createCategory,
        setRefresh,
        downloadReport,
    };
};

export default useGetAttestationCategories;
