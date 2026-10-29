import { useCallback, useEffect, useState } from 'react';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import {
    createCategory,
    createDocument,
    getCategories,
    updateDocument,
    updateCategory,
} from '../../api/payrollDocs';
import {
    CategoryPostType,
    CategoryUpdatePayload,
    Document,
    DocumentUpdateRequest,
    PayrollCategory,
    document,
} from '../../types/payrollDocTypes';

const useCategories = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createCatLoading, setCreateCatLoading] = useState(false);
    const [updateCatLoading, setUpdateCatLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<DropDown | any[]>([]);
    const getAllCategories = useCallback(async () => {
        setIsLoading(true);

        try {
            const res = await getCategories({
                userId: id,
                userType: role,
            });

            if (res && res.status) {
                const categories = res.data.categoryDataWithDocuments.map(
                    (item: PayrollCategory) => ({
                        value: item.id.toString(),
                        label: item.categoryName,
                        documents: item.documents.map((sub: document) => ({
                            value: sub.id.toString(),
                            label: sub.name,
                        })),
                    })
                );
                setCategoryData(categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    const updateDoc = useCallback(
        async (payload: DocumentUpdateRequest) => {
            setUpdateLoading(true);
            const data: SuccessGenericResponse<Document> | false = await updateDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setUpdateLoading(false);
            return false;
        },
        [id, role]
    );
    const updateCat = useCallback(
        async (payload: CategoryUpdatePayload) => {
            setUpdateCatLoading(true);
            const data = await updateCategory({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setUpdateCatLoading(false);
            return false;
        },
        [id, role]
    );
    const createDoc = useCallback(
        async (payload: DocumentUpdateRequest) => {
            setCreateLoading(true);
            const docpayload = {
                ...payload,
                documentBase: payload.documentBase64
                    ? {
                          base64: payload.documentBase64,
                          format: payload.documentFormat || '',
                      }
                    : undefined,
            };
            const data: SuccessGenericResponse<Document> | false = await createDocument({
                userId: id,
                userType: role,
                ...docpayload,
            });
            if (data) {
                return data;
            }
            setCreateLoading(false);
            return false;
        },
        [id, role]
    );

    const createCat = useCallback(
        async (payload: CategoryPostType) => {
            setCreateCatLoading(true);

            const data = await createCategory({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setCreateCatLoading(false);
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    return {
        isLoading,
        createLoading,
        createDoc,
        updateDoc,
        categoryData,
        updateLoading,
        createCatLoading,
        createCat,
        updateCat,
        updateCatLoading,
    };
};

export default useCategories;
