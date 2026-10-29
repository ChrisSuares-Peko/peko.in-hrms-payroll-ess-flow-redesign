import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { createCatalogItem, deleteCatalogItem, fetchCatalog, updateCatalogItem } from '../../api/catalog';
import { productFormSchema } from '../../schema/product';
import { CatalogItemApiData } from '../../types/catalog';

type ProductFormValues = {
    name: string;
    description: string;
    hsnCode: string;
    unitPrice: number;
    gstRate: string;
};

const INITIAL_FORM_VALUES: ProductFormValues = {
    name: '',
    description: '',
    hsnCode: '',
    unitPrice: 0,
    gstRate: '5',
};

export const useProductCatalog = () => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(s => (s as any).reducer.auth);

    const [items, setItems] = useState<CatalogItemApiData[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        pageSize: 10,
        from: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
        to: dayjs().format('YYYY-MM-DD'),
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItemApiData | null>(null);

    const fetchTableData = useCallback(async () => {
        setIsLoading(true);
        const result = await fetchCatalog({
            userId: id,
            userType: role,
            searchText: filters.searchText || undefined,
            from: filters.from,
            to: filters.to,
            page: filters.page,
            itemsPerPage: filters.pageSize,
            sort: 'DESC',
            sortField: 'createdAt',
        });
        if (result) {
            const formatted = result.rows.map(item => ({
                ...item,
                gstPercent: `${item.gstPercent}%`,
            }));
            setItems(formatted);
            setTotal(result.count);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    const setRange = useCallback((val: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
        setFilters(prev => ({
            ...prev,
            from: val?.[0]?.format('YYYY-MM-DD') ?? '',
            to: val?.[1]?.format('YYYY-MM-DD') ?? '',
            page: 1,
        }));
    }, []);

    const setPage = useCallback((p: number) => {
        setFilters(prev => ({ ...prev, page: p }));
    }, []);

    const setPageSize = useCallback((ps: number) => {
        setFilters(prev => ({ ...prev, pageSize: ps }));
    }, []);

    const formik = useFormik<ProductFormValues>({
        initialValues: INITIAL_FORM_VALUES,
        validationSchema: productFormSchema,
        enableReinitialize: true,
        onSubmit: async values => {
            setIsSubmitting(true);
            if (editingItem) {
                const result = await updateCatalogItem({
                    userId: id,
                    userType: role,
                    catalogId: editingItem.id,
                    name: values.name,
                    description: values.description,
                    hsnCode: values.hsnCode || undefined,
                    unitPrice: String(values.unitPrice),
                    gstPercent: String(values.gstRate),
                });
                if (result) {
                    setItems(prev => prev.map(p => (p.id === result.id ? result : p)));
                    dispatch(showToast({ description: 'Catalog Item updated successfully', variant: 'success' }));
                    handleClose();
                }
            } else {
                const result = await createCatalogItem({
                    userId: id,
                    userType: role,
                    name: values.name,
                    description: values.description,
                    hsnCode: values.hsnCode || undefined,
                    unitPrice: String(values.unitPrice),
                    gstPercent: String(values.gstRate),
                });
                if (result) {
                    setItems(prev => [result, ...prev]);
                    setTotal(prev => prev + 1);
                    dispatch(showToast({ description: 'Catalog Item added successfully', variant: 'success' }));
                    handleClose();
                }
            }
            setIsSubmitting(false);
        },
    });

    const handleOpenAdd = useCallback(() => {
        setEditingItem(null);
        formik.resetForm({ values: INITIAL_FORM_VALUES });
        setIsModalOpen(true);
    }, [formik]);

    const handleOpenEdit = useCallback(
        (item: CatalogItemApiData) => {
            setEditingItem(item);
            formik.resetForm({
                values: {
                    name: item.name,
                    description: item.description ?? '',
                    hsnCode: item.hsnCode ?? '',
                    unitPrice: parseFloat(item.unitPrice),
                    gstRate: (item.gstPercent ?? '').replace('%', '') || '5',
                },
            });
            setIsModalOpen(true);
        },
        [formik]
    );

    const handleClose = useCallback(() => {
        setIsModalOpen(false);
        setEditingItem(null);
        formik.resetForm({ values: INITIAL_FORM_VALUES });
    }, [formik]);

    const handleDelete = useCallback(
        async (itemId: number) => {
            const success = await deleteCatalogItem({ userId: id, userType: role, catalogId: itemId });
            if (success) {
                setItems(prev => prev.filter(p => p.id !== itemId));
                setTotal(prev => prev - 1);
                dispatch(showToast({ description: 'Catalog Item deleted successfully', variant: 'success' }));
            }
        },
        [dispatch, id, role]
    );

    const range: [dayjs.Dayjs, dayjs.Dayjs] | null =
        filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null;

    return {
        items,
        total,
        isLoading,
        search: searchText,
        updateSearchText,
        range,
        setRange,
        page: filters.page,
        setPage,
        pageSize: filters.pageSize,
        setPageSize,
        isModalOpen,
        isSubmitting,
        editingItem,
        formik,
        handleOpenAdd,
        handleOpenEdit,
        handleClose,
        handleDelete,
    };
};
