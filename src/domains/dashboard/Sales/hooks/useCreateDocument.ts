import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createCatalogItem } from '../api/catalog';
import {
    createDocument,
    getAllCustomersForSelect,
    getDocumentById,
    getNextDocumentNumberApi,
    updateDocument,
} from '../api/documents';
import { getProfileAddressesApi, getSettingsApi } from '../api/settings';
import { CreateDocumentFormValues, CustomerOption } from '../types/createDocument';
import { DOC_LABEL, DocumentType } from '../types/documents';
import { calcDiscount, calcSubtotal, calcTax, calcTotal } from '../utils/documentCalculations';

const useCreateDocument = (
    documentType: DocumentType,
    documentId?: string,
    fromSourceId?: string
) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [editInitialValues, setEditInitialValues] = useState<CreateDocumentFormValues | null>(
        null
    );
    const [convertInitialValues, setConvertInitialValues] =
        useState<Partial<CreateDocumentFormValues> | null>(null);
    const [nextDocumentNumber, setNextDocumentNumber] = useState<string>('');
    const [businessState, setBusinessState] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [autoAddToCatalog, setAutoAddToCatalog] = useState(false);

    const fetchBusinessState = useCallback(async () => {
        const addresses = await getProfileAddressesApi({ userId: id, userType: role });
        const defaultAddr = addresses.find((a: any) => a.default === 1) ?? addresses[0] ?? null;
        if (defaultAddr?.state) setBusinessState(defaultAddr.state);
    }, [id, role]);

    const fetchSettings = useCallback(async () => {
        const resp = await getSettingsApi({ userId: id, userType: role });
        if (resp && resp.data) {
            setAutoAddToCatalog(!!resp.data.autoAddToCatalog);
        }
    }, [id, role]);

    const fetchNextDocumentNumber = useCallback(async () => {
        if (documentId) return;
        const data = await getNextDocumentNumberApi({
            userId: id,
            userType: role,
            documentType,
        });
        if (data && data.nextNumber) setNextDocumentNumber(String(data.nextNumber));
    }, [id, role, documentId, documentType]);

    const fetchCustomers = useCallback(async () => {
        const data = await getAllCustomersForSelect({ userId: id, userType: role });
        if (!data) {
            dispatch(
                showToast({
                    description: 'Something went wrong while fetching customers.',
                    variant: 'error',
                })
            );
        } else {
            setCustomers(data);
        }
    }, [dispatch, id, role]);

    const fetchDocument = useCallback(async () => {
        if (!documentId) return;
        setIsLoading(true);
        const data = await getDocumentById({ userId: id, userType: role, documentId });
        if (!data) {
            dispatch(
                showToast({
                    description: `Failed to load ${DOC_LABEL[documentType]}.`,
                    variant: 'error',
                })
            );
        } else {
            setEditInitialValues({
                buyer: {
                    customerId: data.customerId,
                    name: data.name,
                    gstNumber: data.gstNumber,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    pincode: data.pincode,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    saveCustomer: false,
                },
                document: {
                    type: data.invoiceType as 'DOMESTIC' | 'INTERNATIONAL',
                    documentPrefix: data.prefix || '',
                    documentNumber: data.invoiceNumber,
                    currency: data.currency,
                    documentDate: data.invoiceDate,
                    dueDate: data.dueDate,
                },
                items: data.items.map(item => ({
                    ...item,
                    taxMode: (item.taxMode ?? 'Exclusive') as 'Exclusive' | 'Inclusive',
                })),
                additional: {
                    termsAndConditions: data.termsAndConditions,
                    notes: data.notes,
                    shippingCost: data.shippingCost,
                    amountPaid: data.amountPaid,
                    paymentMode: data.paymentMode,
                },
            });
        }
        setIsLoading(false);
    }, [documentId, documentType, id, role, dispatch]);

    const buildPayload = useCallback(
        (values: CreateDocumentFormValues) => {
            const {
                type: transactionType,
                documentPrefix: prefix,
                documentDate: invoiceDate,
                documentNumber: invoiceNumber,
                ...documentRest
            } = values.document;
            const isInterState =
                transactionType === 'DOMESTIC' &&
                !!businessState &&
                !!values.buyer.state &&
                values.buyer.state.toLowerCase() !== businessState.toLowerCase();
            let taxType: 'Intra-State' | 'Inter-State' | null = null;
            if (transactionType !== 'INTERNATIONAL') {
                taxType = isInterState ? 'Inter-State' : 'Intra-State';
            }
            // signature/removeSignature are only used to silently sync business Settings after a
            // successful create — they are not part of the document creation payload itself.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { signature, removeSignature, ...additionalRest } = values.additional;
            return {
                userId: id,
                userType: role,
                documentType,
                ...values.buyer,
                invoiceType: transactionType,
                prefix,
                invoiceDate,
                invoiceNumber,
                ...documentRest,
                items: values.items.map(item => ({
                    ...item,
                    discount: item.discount || '0',
                })),
                ...additionalRest,
                shippingCost: values.additional.shippingCost || '0',
                amountPaid: values.additional.amountPaid || '0',
                subtotal: calcSubtotal(values.items),
                discount: calcDiscount(values.items),
                tax: calcTax(values.items),
                totalAmount: calcTotal(values.items, values.additional.shippingCost || '0'),
                taxType,
            };
        },
        [id, role, documentType, businessState]
    );

    const fetchQuotationForConversion = useCallback(async () => {
        if (!fromSourceId) return;
        setIsLoading(true);
        const data = await getDocumentById({
            userId: id,
            userType: role,
            documentId: fromSourceId,
        });
        if (data) {
            setConvertInitialValues({
                buyer: {
                    customerId: data.customerId,
                    name: data.name,
                    gstNumber: data.gstNumber,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    pincode: data.pincode,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    saveCustomer: false,
                },
                items: data.items.map(item => ({
                    ...item,
                    taxMode: (item.taxMode ?? 'Exclusive') as 'Exclusive' | 'Inclusive',
                })),
                additional: {
                    termsAndConditions: data.termsAndConditions,
                    notes: data.notes,
                    shippingCost: data.shippingCost,
                    amountPaid: data.amountPaid,
                    paymentMode: data.paymentMode,
                },
            });
        }
        setIsLoading(false);
    }, [fromSourceId, id, role]);

    const handleDocument = useCallback(
        async (values: CreateDocumentFormValues, onSuccess?: (id: string) => void) => {
            setIsLoading(true);
            const payload = buildPayload(values);
            const resp: false | SuccessGenericResponse<{ id: string }> = documentId
                ? await updateDocument({ ...payload, documentId })
                : await createDocument(payload);

            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: documentId
                            ? `${DOC_LABEL[documentType]} updated successfully`
                            : `${DOC_LABEL[documentType]} created successfully`,
                        variant: 'success',
                    })
                );
                // Auto-add manually entered items to catalog (only on create, not edit)
                if (!documentId && autoAddToCatalog) {
                    values.items
                        .filter(item => !item.productId && item.name)
                        .forEach(item => {
                            createCatalogItem({
                                userId: id,
                                userType: role,
                                name: item.name,
                                description: '',
                                hsnCode: item.hsn || undefined,
                                unitPrice: item.unitPrice || '0',
                                gstPercent: item.taxRate || '0',
                            });
                        });
                }
                onSuccess?.(resp.data?.id ?? documentId ?? '');
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
        },
        [dispatch, documentId, documentType, buildPayload, autoAddToCatalog, id, role]
    );

    useEffect(() => {
        fetchBusinessState();
    }, [fetchBusinessState]);
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);
    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);
    useEffect(() => {
        fetchQuotationForConversion();
    }, [fetchQuotationForConversion]);
    useEffect(() => {
        fetchNextDocumentNumber();
    }, [fetchNextDocumentNumber]);

    return {
        customers,
        editInitialValues,
        convertInitialValues,
        nextDocumentNumber,
        isLoading,
        handleDocument,
    };
};

export default useCreateDocument;
