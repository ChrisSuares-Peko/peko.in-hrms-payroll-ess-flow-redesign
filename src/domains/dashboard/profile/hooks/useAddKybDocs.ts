import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { addKyb, getKyb } from '../api/kyb';

export default function useKybDocs() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDocumentUploading, setIsDocumentUploading] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [data, setData] = useState<any>();

    const handleAddkybDocs = async (payload: any) => {
        setIsDocumentUploading(true);
        const response: any | false = await addKyb({
            userId: id,
            userType: role,
            ...payload,
        });
        if (response) {
            if (response.status) {
                return true;
            }
            setIsDocumentUploading(false);
            setRefresh(true);
        }
        setIsDocumentUploading(false);
        return false;
    };

    const getKybList = useCallback(async () => {
        setIsLoading(true);
        const resp: any | false = await getKyb({
            userId: id,
            userType: role,
        });
        if (resp) {
            setData(resp);
            setRefresh(false);
            setIsDocumentUploading(false);
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getKybList();
    }, [getKybList, refresh]);

    return {
        handleAddkybDocs,
        data,
        isLoading,
        isDocumentUploading,
        setRefresh,
    };
}
