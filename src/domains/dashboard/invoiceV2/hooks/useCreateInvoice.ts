/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createCatalogItem } from '../api/catalog';
import {
    createInvoice,
    getAllCustomersForSelect,
    getInvoiceById,
    getNextInvoiceNumberApi,
    updateInvoice,
} from '../api/invoices';
import { getProfileCompanyApi, getSettingsApi } from '../api/settings';
import { CreateInvoiceFormValues, CustomerOption } from '../types/createInvoice';
import { calcDiscount, calcSubtotal, calcTax, calcTotal } from '../utils/invoiceCalculations';

const useCreateInvoice = (
    invoiceId?: string,
    documentType: 'INVOICE' | 'QUOTATION' = 'INVOICE'
) => {
    const [searchParams] = useSearchParams();
    const fromQuotationId = searchParams.get('fromQuotation') ?? undefined;
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [editInitialValues, setEditInitialValues] = useState<CreateInvoiceFormValues | null>(
        null
    );
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('');
    const [businessState, setBusinessState] = useState<string>('');
    const [businessCity, setBusinessCity] = useState<string>('');
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoAddToCatalog, setAutoAddToCatalog] = useState(false);

    const fetchBusinessState = useCallback(async () => {
        const company = await getProfileCompanyApi({ userId: id, userType: role });
        if (company?.state) setBusinessState(company.state);
        if (company?.city) setBusinessCity(company.city);
    }, [id, role]);

    const fetchSettings = useCallback(async () => {
        const resp = await getSettingsApi({ userId: id, userType: role });
        if (resp && resp.data) {
            setAutoAddToCatalog(!!resp.data.autoAddToCatalog);
        }
    }, [id, role]);

    const fetchNextInvoiceNumber = useCallback(async () => {
        if (invoiceId) return;
        const data = await getNextInvoiceNumberApi({ userId: id, userType: role });
        if (data && data.nextNumber) setNextInvoiceNumber(String(data.nextNumber));
    }, [id, role, invoiceId]);

    const fetchCustomers = useCallback(async () => {
        const data: false | CustomerOption[] = await getAllCustomersForSelect({
            userId: id,
            userType: role,
        });
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

    const fetchFromQuotation = useCallback(async () => {
        if (!fromQuotationId || invoiceId) return;
        const data = await getInvoiceById({
            userId: id,
            userType: role,
            invoiceId: fromQuotationId,
        });
        if (data) {
            // Only buyer + items + additional — invoice prefix/number come from settingsInitialValues in the page
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
                items: data.items,
                additional: {
                    termsAndConditions: data.termsAndConditions,
                    notes: data.notes,
                    shippingCost: data.shippingCost,
                    amountPaid: data.amountPaid ?? '0',
                    paymentMode: data.paymentMode,
                },
            } as any);
        }
    }, [fromQuotationId, invoiceId, id, role]);

    const fetchInvoice = useCallback(async () => {
        if (!invoiceId) return;
        const data = await getInvoiceById({ userId: id, userType: role, invoiceId });
        if (!data) {
            dispatch(showToast({ description: 'Failed to load invoice.', variant: 'error' }));
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
                invoice: {
                    type: data.invoiceType as 'DOMESTIC' | 'INTERNATIONAL',
                    invoicePrefix: data.prefix || '',
                    invoiceNumber: data.invoiceNumber,
                    currency: data.currency,
                    exchangeRate: data.conversionRate ? String(data.conversionRate) : '',
                    invoiceDate: data.invoiceDate,
                    dueDate: data.dueDate,
                    dateOfSupply: data.dateOfSupply || '',
                    isCashSale: !!data.cashSale,
                },
                // originalUnitPrice/originalNetAmount hold the as-entered foreign-currency
                // figures for a non-INR invoice — unitPrice/netAmount are the INR-equivalent
                // recomputed server-side. Editing must reload the as-entered figures, not the
                // converted ones (which would otherwise get converted a second time on save).
                items: data.items.map(item => ({
                    ...item,
                    unitPrice: item.originalUnitPrice ?? item.unitPrice,
                    netAmount: item.originalNetAmount ?? item.netAmount,
                })),
                additional: {
                    termsAndConditions: data.termsAndConditions,
                    notes: data.notes,
                    shippingCost: data.shippingCost,
                    amountPaid: data.originalAmountPaid ?? data.amountPaid,
                    paymentMode: data.paymentMode,
                    signature: null,
                    removeSignature: false,
                },
            });
        }
    }, [invoiceId, id, role, dispatch]);

    const buildPayload = useCallback(
        (payload: CreateInvoiceFormValues, autoUpdateDocumentNumber: boolean) => {
            const {
                type: invoiceType,
                invoicePrefix: prefix,
                exchangeRate,
                ...invoiceRest
            } = payload.invoice;
            const isInterState =
                invoiceType === 'DOMESTIC' &&
                !!businessState &&
                !!payload.buyer.state &&
                payload.buyer.state.toLowerCase() !== businessState.toLowerCase();
            let taxType: 'Intra-State' | 'Inter-State' | null = null;
            if (invoiceType !== 'INTERNATIONAL') {
                taxType = isInterState ? 'Inter-State' : 'Intra-State';
            }
            const { signature, removeSignature, ...additionalRest } = payload.additional;
            return {
                userId: id,
                userType: role,
                ...payload.buyer,
                invoiceType,
                prefix,
                ...invoiceRest,
                conversionRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
                ...(fromQuotationId && { fromQuotationId }),
                invoiceNumber: String(invoiceRest.invoiceNumber),
                dateOfSupply: invoiceRest.dateOfSupply || null,
                items: payload.items.map(item => ({
                    ...item,
                    hsn: item.hsn,
                    discount: item.discount || '0',
                    taxRate: item.taxRate,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                ...additionalRest,
                subtotal: calcSubtotal(payload.items),
                discount: calcDiscount(payload.items),
                tax: calcTax(payload.items),
                totalAmount: calcTotal(payload.items, payload.additional.shippingCost),
                taxType,
                documentType,
                autoUpdateDocumentNumber: Boolean(autoUpdateDocumentNumber),
            };
        },
        [id, role, businessState, documentType, fromQuotationId]
    );

    const handleInvoice = useCallback(
        async (
            payload: CreateInvoiceFormValues,
            autoUpdateDocumentNumber: boolean,
            onSuccess?: (id: string) => void
        ) => {
            setIsSubmitting(true);
            const builtPayload = buildPayload(payload, autoUpdateDocumentNumber);
            const resp: false | SuccessGenericResponse<{ id: string }> = invoiceId
                ? await updateInvoice({ ...builtPayload, invoiceId })
                : await createInvoice(builtPayload);

            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: invoiceId
                            ? `${documentType === 'QUOTATION' ? 'Quotation' : 'Invoice'} updated successfully`
                            : `${documentType === 'QUOTATION' ? 'Quotation' : 'Invoice'} generated successfully`,
                        variant: 'success',
                    })
                );
                // Auto-add manually entered items to catalog (only on create, not edit)
                if (!invoiceId && autoAddToCatalog) {
                    payload.items
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
                onSuccess?.(resp.data?.id ?? invoiceId ?? '');
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsSubmitting(false);
        },
        [dispatch, invoiceId, buildPayload, autoAddToCatalog, id, role, documentType]
    );

    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            setIsInitialLoading(true);
            await Promise.all([
                fetchCustomers(),
                fetchInvoice(),
                fetchFromQuotation(),
                fetchNextInvoiceNumber(),
                fetchBusinessState(),
                fetchSettings(),
            ]);
            if (isMounted) {
                setIsInitialLoading(false);
            }
        };

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, [
        fetchBusinessState,
        fetchCustomers,
        fetchFromQuotation,
        fetchInvoice,
        fetchNextInvoiceNumber,
        fetchSettings,
    ]);

    return {
        customers,
        editInitialValues,
        nextInvoiceNumber,
        businessState,
        businessCity,
        isInitialLoading,
        isSubmitting,
        handleInvoice,
    };
};

export default useCreateInvoice;
