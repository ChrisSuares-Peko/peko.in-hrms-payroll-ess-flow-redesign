import { useCallback, useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getAllInvoices, getInvoiceById, getNextCreditNoteNumberApi } from '../../../api/invoices';
import { CreateInvoiceFormValues, ItemValues } from '../../../types/createInvoice';
import { GetInvoiceByIdResponse } from '../../../types/invoice';
import { CreditNoteAvailableProduct } from '../../../utils/table_column/itemsTableColumns';

const useCreateCreditNote = (defaultDueDays = 15) => {
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const cnInvoiceIdParam = searchParams.get('invoiceId');

    const [cnLinkedInvoice, setCnLinkedInvoice] = useState<GetInvoiceByIdResponse | null>(null);
    const [loadingCnInvoice, setLoadingCnInvoice] = useState(false);
    const [invoiceOptions, setInvoiceOptions] = useState<{ id: string; label: string }[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [nextCnNumber, setNextCnNumber] = useState('');

    useEffect(() => {
        setLoadingInvoices(true);
        getAllInvoices({ userId, userType: role, itemsPerPage: 100 }).then(data => {
            if (data) {
                setInvoiceOptions(
                    data.invoiceData.map(inv => ({
                        id: inv.id,
                        label: `${inv.prefix ?? ''}${inv.invoiceNumber} — ${inv.name}`,
                    }))
                );
            }
            setLoadingInvoices(false);
        });
    }, [userId, role]);

    const loadLinkedInvoice = useCallback(
        async (invoiceId: string) => {
            setLoadingCnInvoice(true);
            const [data, nextNum] = await Promise.all([
                getInvoiceById({ userId, userType: role, invoiceId }),
                getNextCreditNoteNumberApi({ userId, userType: role }),
            ]);
            if (data) setCnLinkedInvoice(data);
            if (nextNum) setNextCnNumber(String(nextNum.nextNumber));
            setLoadingCnInvoice(false);
        },
        [userId, role]
    );

    useEffect(() => {
        if (cnInvoiceIdParam) loadLinkedInvoice(cnInvoiceIdParam);
    }, [cnInvoiceIdParam, loadLinkedInvoice]);

    const handleInvoicePick = (invoiceId: string) => {
        navigate(
            `/${paths.invoice.index}/${paths.invoice.creditNoteCreate}?invoiceId=${invoiceId}`
        );
    };

    // How much of each line item is still creditable: original quantity minus whatever's
    // already been credited by prior credit notes issued against this same invoice.
    const [existingCreditNotes, setExistingCreditNotes] = useState<
        { items?: ItemValues[]; shippingCost?: string }[]
    >([]);

    useEffect(() => {
        if (!cnLinkedInvoice?.id) {
            setExistingCreditNotes([]);
            return;
        }
        getAllInvoices({
            userId,
            userType: role,
            documentType: 'CREDIT_NOTE',
            linkedInvoiceId: cnLinkedInvoice.id,
            itemsPerPage: 100,
        }).then(data => {
            if (data) setExistingCreditNotes(data.invoiceData as any);
        });
    }, [cnLinkedInvoice?.id, userId, role]);

    const availableProducts = useMemo<CreditNoteAvailableProduct[]>(() => {
        if (!cnLinkedInvoice) return [];

        const creditedQtyByItemId: Record<string, number> = {};
        existingCreditNotes.forEach(cn => {
            (cn.items || []).forEach(item => {
                if (!item.itemId) return;
                creditedQtyByItemId[item.itemId] =
                    (creditedQtyByItemId[item.itemId] || 0) + (parseFloat(item.quantity) || 0);
            });
        });

        return (cnLinkedInvoice.items || [])
            .filter(item => !!item.itemId)
            .map(item => {
                const originalQuantity = parseFloat(item.quantity) || 0;
                const alreadyCredited = creditedQtyByItemId[item.itemId as string] || 0;
                return {
                    itemId: item.itemId as string,
                    name: item.name,
                    hsn: item.hsn,
                    unit: item.unit,
                    // For a foreign-currency invoice, item.unitPrice is the INR-equivalent
                    // (recomputed server-side) — the credit note must match the as-entered
                    // figure, both for display and so the backend's price-match validation
                    // (which also compares against the original) agrees.
                    unitPrice: item.originalUnitPrice ?? item.unitPrice,
                    discount: item.discount,
                    taxRate: item.taxRate,
                    taxMode: 'Exclusive' as const,
                    productId: item.productId,
                    availableQuantity: Math.max(0, originalQuantity - alreadyCredited),
                };
            })
            .filter(p => p.availableQuantity > 0);
    }, [cnLinkedInvoice, existingCreditNotes]);

    const cnInitialValues = useMemo<CreateInvoiceFormValues | null>(() => {
        if (!cnLinkedInvoice) return null;
        const items: ItemValues[] =
            availableProducts.length > 0
                ? availableProducts.map(p => ({
                      name: p.name,
                      hsn: p.hsn,
                      quantity: String(p.availableQuantity),
                      unit: p.unit,
                      unitPrice: p.unitPrice,
                      discount: p.discount,
                      taxRate: p.taxRate,
                      taxMode: 'Exclusive' as const,
                      netAmount: '',
                      productId: p.productId,
                      itemId: p.itemId,
                  }))
                : [];

        return {
            buyer: {
                name: cnLinkedInvoice.name || '',
                gstNumber: cnLinkedInvoice.gstNumber || '',
                address: cnLinkedInvoice.address || '',
                city: cnLinkedInvoice.city || '',
                state: cnLinkedInvoice.state || '',
                country: cnLinkedInvoice.country || '',
                pincode: cnLinkedInvoice.pincode || '',
                email: cnLinkedInvoice.email || '',
                phoneNumber: cnLinkedInvoice.phoneNumber || '',
                saveCustomer: false,
            },
            invoice: {
                // Currency, exchange rate, and type are all inherited from the linked invoice,
                // not independently settable on a credit note — same as Peko-AE.
                type: (cnLinkedInvoice.invoiceType as 'DOMESTIC' | 'INTERNATIONAL') || 'DOMESTIC',
                invoicePrefix: 'CN-',
                invoiceNumber: nextCnNumber,
                currency: cnLinkedInvoice.currency || 'INR',
                exchangeRate: cnLinkedInvoice.conversionRate
                    ? String(cnLinkedInvoice.conversionRate)
                    : '',
                invoiceDate: dayjs().format('YYYY-MM-DD'),
                dueDate: '',
                dateOfSupply: '',
                isCashSale: !!cnLinkedInvoice.cashSale,
            },
            items,
            additional: {
                termsAndConditions: cnLinkedInvoice.termsAndConditions || '',
                notes: cnLinkedInvoice.notes || '',
                shippingCost: '',
                amountPaid: '',
                paymentMode: cnLinkedInvoice.paymentMode || 'CASH',
                signature: null,
                removeSignature: false,
            },
            creditNote: {
                reason: '',
                reasonDetail: '',
            },
        };
    }, [cnLinkedInvoice, nextCnNumber, availableProducts]);

    const handleCreditNoteSubmit = (values: CreateInvoiceFormValues) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.creditNotePreview}`, {
            state: {
                formValues: values,
                linkedInvoiceId: cnLinkedInvoice?.id,
                linkedInvoice: cnLinkedInvoice,
                reason: values.creditNote?.reason ?? '',
                reasonDetail: values.creditNote?.reasonDetail ?? '',
            },
        });
    };

    return {
        cnLinkedInvoice,
        loadingCnInvoice,
        invoiceOptions,
        loadingInvoices,
        cnInitialValues,
        availableProducts,
        handleInvoicePick,
        handleCreditNoteSubmit,
    };
};

export default useCreateCreditNote;
