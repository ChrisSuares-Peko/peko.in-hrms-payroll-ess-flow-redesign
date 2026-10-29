import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createDocument, deleteDocument, getAllDocs, updateDocument } from '../api/index';

export default function useDocApi({ searchText, page, itemsPerPage, from, to, pageSize }: any) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    // isLoading covers the first load only (the page shows a skeleton). Mutations refetch in the
    // background via isRefreshing so the vehicle cards stay mounted instead of vanishing (ticket 31002).
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [doc, setDocs] = useState<any>([]);
    const [count, setCount] = useState<number>(1);

    const getDocs = useCallback(async () => {
        const data: any | false = await getAllDocs({
            userId: id,
            userType: role,
            from,
            to,
            searchText,
            page,
            itemsPerPage,
            pageSize,
        });
        if (data) {
            setDocs(data.data);
            setCount(data.recordsTotal);
        }
        return data;
    }, [id, role, from, to, searchText, page, itemsPerPage, pageSize]);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        getDocs().finally(() => {
            if (active) setIsLoading(false);
        });
        return () => {
            active = false;
        };
    }, [getDocs]);

    const refetch = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await getDocs();
        } finally {
            setIsRefreshing(false);
        }
    }, [getDocs]);

    const createDoc = useCallback(
        async (payload: any) => {
            const data: SuccessGenericResponse<any> | false = await createDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                await refetch();
                return data;
            }
            return false;
        },
        [id, role, refetch]
    );

    const updateDoc = useCallback(
        async (docId: any, payload: any) => {
            const data: SuccessGenericResponse<any> | false = await updateDocument({
                userId: id,
                userType: role,
                ...payload,
                docId,
            });
            if (data) {
                await refetch();
                return data;
            }
            return false;
        },
        [id, role, refetch]
    );

    const deteteDoc = useCallback(
        async (docId: number) => {
            const data: SuccessGenericResponse<any> | false = await deleteDocument({
                userId: id,
                userType: role,
                docId,
            });
            if (data) {
                await refetch();
                return true;
            }
            return false;
        },
        [id, role, refetch]
    );

    return { isLoading, isRefreshing, doc, count, createDoc, deteteDoc, updateDoc, refetch };
}
