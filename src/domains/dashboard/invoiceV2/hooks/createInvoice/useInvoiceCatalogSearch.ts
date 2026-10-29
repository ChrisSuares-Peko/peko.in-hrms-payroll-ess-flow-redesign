import { useCallback, useEffect, useState } from 'react';

import { useFormik, useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import useDebounce from '@src/hooks/useDebounce';
import { showToast } from '@src/slices/apiSlice';

import { createCatalogItem, fetchCatalog } from '../../api/catalog';
import { productFormSchema } from '../../schema/product';
import { CatalogItemApiData } from '../../types/catalog';
import { CreateInvoiceFormValues } from '../../types/createInvoice';

const INITIAL_FORM = { name: '', description: '', hsnCode: '', unitPrice: 0, gstRate: '5' };

export const useInvoiceCatalogSearch = () => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(s => (s as any).reducer.auth);
    const { setFieldValue } = useFormikContext<CreateInvoiceFormValues>();

    // ── Dropdown search ──────────────────────────────────────────────────────
    const [catalogItems, setCatalogItems] = useState<CatalogItemApiData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const debouncedSearch = useDebounce(searchText, 300);

    const fetchOptions = useCallback(async () => {
        setIsLoading(true);
        const result = await fetchCatalog({
            userId: id,
            userType: role,
            searchText: debouncedSearch || undefined,
            itemsPerPage: 100,
            sort: 'ASC',
            sortField: 'name',
        });
        if (result) setCatalogItems(result.rows);
        setIsLoading(false);
    }, [id, role, debouncedSearch]);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const options = catalogItems.map(item => ({
        value: String(item.id),
        label: item.name,
    }));

    // ── Add new item modal ───────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const catalogFormik = useFormik({
        initialValues: INITIAL_FORM,
        validationSchema: productFormSchema,
        enableReinitialize: true,
        onSubmit: async values => {
            setIsSubmitting(true);
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
                dispatch(showToast({ description: `${result.name} added to catalog`, variant: 'success' }));
                setCatalogItems(prev => [result, ...prev]);
                setFieldValue(`items[${activeRowIndex}].name`, result.name);
                setFieldValue(`items[${activeRowIndex}].unitPrice`, result.unitPrice);
                setFieldValue(`items[${activeRowIndex}].taxRate`, result.gstPercent ?? '0');
                setFieldValue(`items[${activeRowIndex}].hsn`, result.hsnCode ?? '');
                setFieldValue(`items[${activeRowIndex}].productId`, String(result.id));
                handleClose();
            }
            setIsSubmitting(false);
        },
    });

    const handleOpenAddModal = (rowIndex: number) => {
        setActiveRowIndex(rowIndex);
        catalogFormik.resetForm({ values: INITIAL_FORM });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        catalogFormik.resetForm({ values: INITIAL_FORM });
    };

    const handleModalSubmit = () => {
        catalogFormik.handleSubmit();
    };

    return {
        // dropdown
        catalogItems,
        options,
        isLoading,
        setSearchText,
        // modal
        isModalOpen,
        isSubmitting,
        catalogFormik,
        handleOpenAddModal,
        handleClose,
        handleModalSubmit,
    };
};
