import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createOndcCategoryApi,
    deleteOndcCategoryApi,
    getOndcCategoriesTree,
    setOndcCategoryEnabledApi,
    updateOndcCategoryApi,
} from '../../api/ondcCategories';
import { OndcCategoryFormValues, OndcCategoryTreeRow } from '../../types/ondcCategory';

/** Admin ONDC category tree — list + add/edit/delete + enable toggle (Manage > Products > Categories tab). */
const useOndcCategories = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [tree, setTree] = useState<OndcCategoryTreeRow[]>([]);

    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data = await getOndcCategoriesTree({ userId: id, userType: role });
        if (data) setTree(data);
        setIsLoading(false);
    }, [id, role]);

    const createCategory = async (values: OndcCategoryFormValues, parentId?: number) => {
        const res = await createOndcCategoryApi({
            userId: id,
            userType: role,
            ...values,
            parentId,
        });
        if (res) await getAllTableData();
        return !!res;
    };

    const updateCategory = async (categoryId: number, values: OndcCategoryFormValues) => {
        const res = await updateOndcCategoryApi({
            userId: id,
            userType: role,
            id: categoryId,
            ...values,
        });
        if (res) {
            dispatch(showToast({ variant: 'success', description: 'Category edited successfully' }));
            await getAllTableData();
        }
        return !!res;
    };

    /**
     * Permanently removes a category. Deleting a top-level one takes its
     * subcategories with it server-side, so the tree is re-read rather than
     * patched locally.
     */
    const deleteCategory = async (categoryId: number) => {
        const res = await deleteOndcCategoryApi({ userId: id, userType: role, id: categoryId });
        dispatch(
            showToast({
                variant: res ? 'success' : 'error',
                description: res ? 'Category deleted.' : 'Could not delete the category.',
            })
        );
        if (res) await getAllTableData();
        return !!res;
    };

    const toggleEnabled = async (categoryId: number, enabled: boolean, isSubcategory: boolean) => {
        // optimistic flip, revert on failure
        setTree(prev =>
            prev.map(parent => {
                if (!isSubcategory && parent.id === categoryId) return { ...parent, enabled };
                if (isSubcategory) {
                    return {
                        ...parent,
                        subcategories: parent.subcategories.map(sub =>
                            sub.id === categoryId ? { ...sub, enabled } : sub
                        ),
                    };
                }
                return parent;
            })
        );
        const ok = await setOndcCategoryEnabledApi({
            userId: id,
            userType: role,
            id: categoryId,
            enabled,
        });
        if (!ok) {
            setTree(prev =>
                prev.map(parent => {
                    if (!isSubcategory && parent.id === categoryId)
                        return { ...parent, enabled: !enabled };
                    if (isSubcategory) {
                        return {
                            ...parent,
                            subcategories: parent.subcategories.map(sub =>
                                sub.id === categoryId ? { ...sub, enabled: !enabled } : sub
                            ),
                        };
                    }
                    return parent;
                })
            );
        }
        return !!ok;
    };

    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    return {
        isLoading,
        tree,
        getAllTableData,
        createCategory,
        updateCategory,
        deleteCategory,
        toggleEnabled,
    };
};

export default useOndcCategories;
