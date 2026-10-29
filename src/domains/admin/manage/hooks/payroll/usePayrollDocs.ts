import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllData,
    getUpdateStatus,
    deleteDocument,
    getFileBufferReport,
    deleteCategory,
} from '../../api/payrollDocs';
import {
    Document,
    DocumentData,
    DownloadType,
    activeResponse,
    getPayrollDocs,
    updateStatus,
} from '../../types/payrollDocTypes';

const usePayrollDocs = ({ searchText, itemsPerPage, page, sort, sortField }: getPayrollDocs) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [bufferLoading, setBufferLoading] = useState<DownloadType | null>(null);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Document[]>();
    const dispatch = useAppDispatch();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: DocumentData | false = await getAllData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);

    const updateActiveStatus = useCallback(
        async ({ docId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                docId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (docId: number) => {
            setIsLoading(true);
            const data: any = await deleteDocument({
                userId: id,
                userType: role,
                docId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Document deleted successfully`,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }
            }
        },
        [dispatch, id, role]
    );

    const categoryDelete = useCallback(
        async (categoryId: number) => {
            setIsLoading(true);
            const data: any = await deleteCategory({
                userId: id,
                userType: role,
                categoryId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Category deleted successfully`,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }
            }
        },
        [dispatch, id, role]
    );

    const downloadReport = async (type: DownloadType) => {
        setBufferLoading(type);
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
                saveAs(blob, `Company-Docs.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Company-Docs.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Company-Docs.pdf`);
            }
        }
        setBufferLoading(null);
    };

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        deleteDoc,
        setRefresh,
        downloadReport,
        bufferLoading,
        categoryDelete,
    };
};

export default usePayrollDocs;
