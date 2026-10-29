import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createDocument, getCategories, updateDocument } from '../api/edocApi';
import { Category, CategoryData, Document, DocumentUpdateRequest } from '../types/edocTypes';

const useEdocAltering = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<DropDown>();
    const getAllCategories = useCallback(async () => {
        setIsLoading(true);
        const data: CategoryData | false = await getCategories({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.categoryData.map((item: Category) => ({
                value: item.id.toString(),
                label: item.categoryName.toString(),
            }));
            setCategoryData(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    const updateDoc = useCallback(
        async (payload: DocumentUpdateRequest) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<Document> | false = await updateDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const createDoc = useCallback(
        async (payload: DocumentUpdateRequest) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<Document> | false = await createDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    return { isLoading, createDoc, updateDoc, categoryData };
};

export default useEdocAltering;
