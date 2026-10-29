import { useEffect, useState } from 'react';

import { ArrowLeftOutlined, CheckCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Spin, Typography } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { createCreditNoteApi, getInvoiceById } from '../../api/invoices';
import useInvoiceDetails from '../../hooks/invoiceDetails/useInvoiceDetails';
import useSettings from '../../hooks/useSettings';
import { CreateInvoiceFormValues, ItemValues } from '../../types/createInvoice';
import { GetInvoiceByIdResponse } from '../../types/invoice';
import { calcDiscount, calcSubtotal, calcTax, calcTotal } from '../../utils/invoiceCalculations';

interface PreviewState {
    formValues: CreateInvoiceFormValues;
    linkedInvoiceId: string;
    linkedInvoice: GetInvoiceByIdResponse;
    reason: string;
    reasonDetail: string;
}

const REASON_LABELS: Record<string, string> = {
    GOODS_RETURNED: 'Goods Returned',
    OVERCHARGE: 'Overcharge',
    SERVICE_CANCELLED: 'Service Cancelled',
    DISCOUNT: 'Discount',
    OTHER: 'Other',
};

// Client-side credit note template (rendered before issuing)
const CreditNoteTemplate = ({
    formValues,
    linkedInvoice,
    reason,
    reasonDetail,
    sellerName,
    sellerPhone,
    sellerEmail,
    sellerState,
    logoUrl,
}: {
    formValues: CreateInvoiceFormValues;
    linkedInvoice: GetInvoiceByIdResponse;
    reason: string;
    reasonDetail: string;
    sellerName: string;
    sellerPhone: string;
    sellerEmail: string;
    sellerState: string;
    logoUrl?: string | null;
}) => {
    const items: ItemValues[] = formValues.items || [];
    const subtotal = parseFloat(calcSubtotal(items) as string) || 0;
    const discount = parseFloat(calcDiscount(items) as string) || 0;
    const tax = parseFloat(calcTax(items) as string) || 0;
    const total = parseFloat(calcTotal(items, formValues.additional.shippingCost) as string) || 0;

    const isInterState =
        !!sellerState &&
        !!formValues.buyer.state &&
        formValues.buyer.state.toLowerCase() !== sellerState.toLowerCase();

    const taxLabel = isInterState ? 'IGST' : 'CGST + SGST';
    const cnNumber = `${formValues.invoice.invoicePrefix || 'CN-'}${formValues.invoice.invoiceNumber || ''}`;
    const linkedRef = `${linkedInvoice?.prefix ?? ''}${linkedInvoice?.invoiceNumber ?? ''}`;

    return (
        <div
            className="px-4 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6"
            style={{
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                color: '#111',
                width: '100%',
                boxSizing: 'border-box',
            }}
        >
            {/* Header */}
            <div
                className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
                style={{
                    marginBottom: 16,
                }}
            >
                <div>
                    {logoUrl && (
                        <img src={logoUrl} alt="logo" style={{ maxHeight: 48, marginBottom: 8 }} />
                    )}
                    <div style={{ fontSize: 22, fontWeight: 700 }}>Credit Note</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {linkedRef && (
                            <span
                                style={{
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                    fontSize: 11,
                                }}
                            >
                                Reference: {linkedRef}
                            </span>
                        )}
                        <span
                            style={{
                                background: '#ecfdf5',
                                color: '#065f46',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 11,
                            }}
                        >
                            {REASON_LABELS[reason] ?? reason}
                        </span>
                    </div>
                    {reasonDetail && (
                        <div style={{ marginTop: 4, fontSize: 11, color: '#6b7280' }}>
                            {reasonDetail}
                        </div>
                    )}
                </div>
                <div className="text-left sm:text-right" style={{ fontSize: 12, lineHeight: 1.8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cnNumber}</div>
                    {formValues.invoice.invoiceDate && (
                        <div style={{ color: '#6b7280' }}>
                            Issue Date: {formValues.invoice.invoiceDate}
                        </div>
                    )}
                    {formValues.invoice.dueDate && (
                        <div style={{ color: '#6b7280' }}>Due: {formValues.invoice.dueDate}</div>
                    )}
                </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />

            {/* FROM / BILLED TO */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8" style={{ marginBottom: 20 }}>
                <div className="sm:flex-1">
                    <div
                        style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            fontWeight: 600,
                            marginBottom: 4,
                            letterSpacing: 1,
                        }}
                    >
                        FROM
                    </div>
                    <div style={{ fontWeight: 700 }}>{sellerName}</div>
                    {sellerPhone && <div style={{ color: '#374151' }}>{sellerPhone}</div>}
                    {sellerEmail && <div style={{ color: '#374151' }}>{sellerEmail}</div>}
                </div>
                <div className="sm:flex-1">
                    <div
                        style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            fontWeight: 600,
                            marginBottom: 4,
                            letterSpacing: 1,
                        }}
                    >
                        BILLED TO
                    </div>
                    <div style={{ fontWeight: 700 }}>{formValues.buyer.name}</div>
                    {formValues.buyer.address && (
                        <div style={{ color: '#374151' }}>{formValues.buyer.address}</div>
                    )}
                    {formValues.buyer.phoneNumber && (
                        <div style={{ color: '#374151' }}>{formValues.buyer.phoneNumber}</div>
                    )}
                    {formValues.buyer.email && (
                        <div style={{ color: '#374151' }}>{formValues.buyer.email}</div>
                    )}
                    {formValues.buyer.gstNumber && (
                        <div style={{ color: '#374151', fontSize: 11 }}>
                            GSTIN: {formValues.buyer.gstNumber}
                        </div>
                    )}
                </div>
                <div className="text-left sm:text-right" style={{ fontSize: 12 }}>
                    <div
                        style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            fontWeight: 600,
                            letterSpacing: 1,
                            marginBottom: 4,
                        }}
                    >
                        DETAILS
                    </div>
                    {linkedInvoice?.invoiceDate && (
                        <div>
                            <span style={{ color: '#6b7280' }}>Invoice Date </span>
                            <strong>{linkedInvoice.invoiceDate}</strong>
                        </div>
                    )}
                    {linkedInvoice?.dueDate && (
                        <div>
                            <span style={{ color: '#6b7280' }}>Due Date </span>
                            <strong>{linkedInvoice.dueDate}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-4">
                <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#1f2937', color: '#fff' }}>
                            {[
                                'Description',
                                'HSN',
                                'Qty',
                                'Price',
                                'Disc %',
                                'Tax Rate %',
                                'Amount',
                            ].map(h => (
                                <th
                                    key={h}
                                    style={{
                                        padding: '8px 10px',
                                        textAlign: h === 'Description' ? 'left' : 'right',
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '8px 10px' }}>{item.name}</td>
                                <td
                                    style={{
                                        padding: '8px 10px',
                                        textAlign: 'right',
                                        color: '#6b7280',
                                    }}
                                >
                                    {item.hsn || '—'}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    {item.quantity} {item.unit}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    ₹{item.unitPrice}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    {item.discount || 0}%
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    {isInterState
                                        ? `${item.taxRate}%`
                                        : `${(parseFloat(item.taxRate || '0') / 2).toFixed(1)}%`}
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    ₹{item.netAmount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 280 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                fontSize: 13,
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>Discount</span>
                            <span>-₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                            fontSize: 13,
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>{taxLabel}</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    {formValues.additional.shippingCost &&
                        parseFloat(formValues.additional.shippingCost) > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '4px 0',
                                    fontSize: 13,
                                }}
                            >
                                <span style={{ color: '#6b7280' }}>Shipping</span>
                                <span>₹{formValues.additional.shippingCost}</span>
                            </div>
                        )}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            marginTop: 4,
                            background: '#fff5f5',
                            borderRadius: 6,
                        }}
                    >
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>Credit Total</span>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>
                            ₹{total.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                        }}
                    >
                        <span style={{ color: '#dc2626' }}>Amount due</span>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                            ₹{total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>
                    This credit note is issued in accordance with applicable GST regulations.
                    Reference the original invoice number for your records.
                </div>
                <div
                    style={{ textAlign: 'right', fontSize: 11, color: '#374151', fontWeight: 600 }}
                >
                    Credit Note created using <strong>Peko</strong>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const CreditNotePreview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: cnId } = useParams<{ id?: string }>();
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const previewState = location.state as PreviewState | null;
    const isViewMode = !!cnId;

    const [isIssuing, setIsIssuing] = useState(false);
    const [linkedInvoiceData, setLinkedInvoiceData] = useState<GetInvoiceByIdResponse | null>(null);

    const { settings } = useSettings({ autoFetch: true, skipProfile: false });

    const { invoiceData, isLoading, downloadCreditNotePdf, isDownloadingCreditNote } =
        useInvoiceDetails(isViewMode ? cnId : undefined);

    useEffect(() => {
        if (!invoiceData) return;
        const linkedId =
            (invoiceData as any).linkedInvoiceId ||
            (invoiceData as any).creditNoteDetails?.linkedInvoiceId;
        if (!linkedId) return;
        getInvoiceById({ userId, userType: role, invoiceId: String(linkedId) }).then(data => {
            if (data) setLinkedInvoiceData(data);
        });
    }, [invoiceData, userId, role]);

    const handleIssueCreditNote = async () => {
        if (!previewState) return;
        const { formValues, linkedInvoiceId, reason, reasonDetail } = previewState;
        setIsIssuing(true);

        const payload = {
            userId,
            userType: role,
            documentType: 'CREDIT_NOTE',
            linkedInvoiceId,
            reason,
            additionalDetails: reasonDetail || '',
            name: formValues.buyer.name,
            gstNumber: formValues.buyer.gstNumber,
            address: formValues.buyer.address,
            city: formValues.buyer.city,
            state: formValues.buyer.state,
            country: formValues.buyer.country,
            pincode: formValues.buyer.pincode,
            email: formValues.buyer.email,
            phoneNumber: formValues.buyer.phoneNumber,
            saveCustomer: false,
            invoiceType: 'DOMESTIC',
            prefix: formValues.invoice.invoicePrefix,
            invoiceNumber: formValues.invoice.invoiceNumber,
            invoiceDate: formValues.invoice.invoiceDate,
            dueDate: formValues.invoice.dueDate,
            currency: 'INR',
            items: formValues.items,
            termsAndConditions: formValues.additional.termsAndConditions,
            notes: formValues.additional.notes,
            shippingCost: formValues.additional.shippingCost,
            amountPaid: formValues.additional.amountPaid,
            paymentMode: formValues.additional.paymentMode,
            subtotal: calcSubtotal(formValues.items),
            discount: calcDiscount(formValues.items),
            tax: calcTax(formValues.items),
            totalAmount: calcTotal(formValues.items, formValues.additional.shippingCost),
        };

        const resp = await createCreditNoteApi(payload as any);
        setIsIssuing(false);

        if (resp && (resp as any).status) {
            dispatch(
                showToast({ description: 'Credit note issued successfully.', variant: 'success' })
            );
            const createdId = (resp as any).data?.id;
            if (createdId) {
                navigate(
                    `/${paths.invoice.index}/${paths.invoice.creditNoteDetails.replace(':id', createdId)}`
                );
            } else {
                navigate(`/${paths.invoice.index}/${paths.invoice.creditNotes}`);
            }
        } else {
            dispatch(
                showToast({
                    description: (resp as any)?.message || 'Failed to issue credit note.',
                    variant: 'error',
                })
            );
        }
    };

    // --- VIEW MODE ---
    if (isViewMode) {
        if (isLoading) return <Skeleton active />;

        const cnDetails = invoiceData?.creditNoteDetails;

        // Build formValues shape from loaded invoiceData for template reuse
        const viewFormValues: CreateInvoiceFormValues | null = invoiceData
            ? {
                  buyer: {
                      name: invoiceData.name,
                      gstNumber: invoiceData.gstNumber,
                      address: invoiceData.address,
                      city: invoiceData.city,
                      state: invoiceData.state,
                      country: invoiceData.country,
                      pincode: invoiceData.pincode,
                      email: invoiceData.email,
                      phoneNumber: invoiceData.phoneNumber,
                      saveCustomer: false,
                  },
                  invoice: {
                      type: invoiceData.invoiceType,
                      invoicePrefix: invoiceData.prefix,
                      invoiceNumber: invoiceData.invoiceNumber,
                      currency: invoiceData.currency,
                      exchangeRate: invoiceData.conversionRate
                          ? String(invoiceData.conversionRate)
                          : '',
                      invoiceDate: invoiceData.invoiceDate,
                      dueDate: invoiceData.dueDate,
                      dateOfSupply: invoiceData.dateOfSupply || '',
                      isCashSale: !!invoiceData.cashSale,
                  },
                  items: invoiceData.items.map(item => ({
                      name: item.name,
                      hsn: item.hsn,
                      quantity: item.quantity,
                      unit: item.unit,
                      unitPrice: item.unitPrice,
                      discount: item.discount,
                      taxRate: item.taxRate,
                      taxMode: 'Exclusive' as const,
                      netAmount: item.netAmount,
                  })),
                  additional: {
                      termsAndConditions: invoiceData.termsAndConditions,
                      notes: invoiceData.notes,
                      shippingCost: invoiceData.shippingCost,
                      amountPaid: invoiceData.amountPaid,
                      paymentMode: invoiceData.paymentMode,
                      signature: null,
                      removeSignature: false,
                  },
              }
            : null;

        const viewLinkedInvoice = {
            prefix: cnDetails?.linkedInvoicePrefix || '',
            invoiceNumber: cnDetails?.linkedInvoiceNumber || '',
            invoiceDate: linkedInvoiceData?.invoiceDate || '',
            dueDate: linkedInvoiceData?.dueDate || '',
        } as GetInvoiceByIdResponse;

        return (
            <Flex vertical className="w-full pt-3" gap={16}>
                <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                    <Flex
                        justify="space-between"
                        align="center"
                        gap={12}
                        className="flex-wrap sm:flex-nowrap mb-3"
                    >
                        <Typography.Title level={4} className="!mb-0 shrink-0">
                            Credit Note
                        </Typography.Title>
                        <Flex gap={8} align="center">
                            <Button
                                icon={<PrinterOutlined />}
                                loading={isDownloadingCreditNote}
                                onClick={() => downloadCreditNotePdf(cnId)}
                            >
                                Print / Download
                            </Button>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() =>
                                    navigate(`/${paths.invoice.index}/${paths.invoice.creditNotes}`)
                                }
                            >
                                Back
                            </Button>
                        </Flex>
                    </Flex>
                    {viewFormValues ? (
                        <CreditNoteTemplate
                            formValues={viewFormValues}
                            linkedInvoice={viewLinkedInvoice}
                            reason={cnDetails?.reason || ''}
                            reasonDetail={cnDetails?.additionalDetails || ''}
                            sellerName={settings?.businessName || ''}
                            sellerPhone={settings?.phone || ''}
                            sellerEmail={settings?.email || ''}
                            sellerState={settings?.state || ''}
                            logoUrl={settings?.logoUrl}
                        />
                    ) : (
                        <Flex
                            align="center"
                            justify="center"
                            className="w-full min-h-[400px] bg-[#F8FAFC] rounded-xl"
                        >
                            <Spin />
                        </Flex>
                    )}
                </div>
            </Flex>
        );
    }

    // --- PREVIEW MODE (before issuing) ---
    if (!previewState) {
        return (
            <Flex align="center" justify="center" className="h-64">
                <Flex vertical align="center" gap={12}>
                    <Typography.Text type="warning">No credit note data found.</Typography.Text>
                    <Button
                        onClick={() =>
                            navigate(`/${paths.invoice.index}/${paths.invoice.creditNotes}`)
                        }
                    >
                        Go Back
                    </Button>
                </Flex>
            </Flex>
        );
    }

    const { formValues, linkedInvoice, reason, reasonDetail } = previewState;

    return (
        <Flex vertical className="w-full pt-3" gap={16}>
            <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <Flex
                    justify="space-between"
                    align="center"
                    gap={12}
                    className="flex-wrap sm:flex-nowrap mb-3"
                >
                    <Typography.Title level={4} className="!mb-0 shrink-0">
                        Credit Note Preview
                    </Typography.Title>
                    <Flex gap={8} align="center">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                            Edit
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<CheckCircleOutlined />}
                            loading={isIssuing}
                            onClick={handleIssueCreditNote}
                        >
                            Issue Credit Note
                        </Button>
                    </Flex>
                </Flex>
                <CreditNoteTemplate
                    formValues={formValues}
                    linkedInvoice={linkedInvoice}
                    reason={reason}
                    reasonDetail={reasonDetail}
                    sellerName={settings?.businessName || ''}
                    sellerPhone={settings?.phone || ''}
                    sellerEmail={settings?.email || ''}
                    sellerState={settings?.state || ''}
                    logoUrl={settings?.logoUrl}
                />
            </div>
        </Flex>
    );
};

export default CreditNotePreview;
