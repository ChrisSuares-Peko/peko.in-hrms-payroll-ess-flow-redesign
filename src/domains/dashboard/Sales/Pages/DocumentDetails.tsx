import { useState } from 'react';

import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import PaymentLinkModal from '../components/collectPayment/paymentLink/PaymentLinkModal.tsx';
import ConvertDocumentCard from '../components/documentDetails/ConvertDocumentCard';
import CreditNoteSection from '../components/documentDetails/CreditNoteSection';
import DocumentActionsCard from '../components/documentDetails/DocumentActionsCard';
import DocumentEmptyState from '../components/documentDetails/DocumentEmptyState';
import DocumentTimeline from '../components/documentDetails/DocumentTimeline';
import PaymentSection from '../components/documentDetails/PaymentSection';
import PaymentTimelineAndDetails from '../components/documentDetails/PaymentTimelineAndDetails';
import QuotationTimeline from '../components/documentDetails/QuotationTimeline';
import InvoiceRemindersSection from '../components/documentDetails/reminder/InvoiceRemindersSection';
import ResponsiveHtmlPreview from '../components/documentDetails/ResponsiveHtmlPreview';
import ShareDocumentModal from '../components/documentDetails/ShareDocumentModal';
import useDocumentDetails from '../hooks/documentDetails/useDocumentDetails';
import useOnboarding from '../hooks/useOnboarding';
import { CollectPaymentKey } from '../types/documentDetails';
import { DOC_LABEL, DocumentType } from '../types/documents';

const ONBOARDING_REQUIRED: CollectPaymentKey[] = ['payment-link'];

interface DocumentDetailsProps {
    documentType: DocumentType;
}

const DocumentDetails = ({ documentType }: DocumentDetailsProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        documentData,
        isLoading,
        downloadPdf,
        isDownloading,
        shareDocument,
        isSharing,
        markAsCompleted,
        isMarkingComplete,
        documentHtml,
        isPreviewLoading,
        paymentHistory,
        creditNotes,
        addPayment,
        deletePayment,
        downloadReceipt,
        shareReceipt,
        isDownloadingReceipt,
        isSharingReceipt,
        billerName,
    } = useDocumentDetails(id, documentType);
    // documentType is fixed per route (Invoice.tsx / SalesOrders.tsx / Quotations.tsx each
    // render this page with a hard-coded prop) — this is the single gate for every
    // Invoice-only feature below (Payment Section + Credit Notes).
    const isInvoice = documentType === 'INVOICE';
    const isSalesOrder = documentType === 'SALES_ORDER';
    const isQuotation = documentType === 'QUOTATION';
    const documentLabel = DOC_LABEL[documentType];
    const { checkOnboardingStatus } = useOnboarding();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [loadingKey, setLoadingKey] = useState<CollectPaymentKey | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleSelect = async (key: CollectPaymentKey) => {
        if (ONBOARDING_REQUIRED.includes(key)) {
            setLoadingKey(key);
            const isOnboarded = await checkOnboardingStatus();
            setLoadingKey(null);
            if (!isOnboarded) {
                navigate(paths.dashboard.paymentLinks);
                return;
            }
        }
        setActiveModal(key);
    };

    // Read-only credit note list only — SalesX never creates/edits credit
    // notes. Always redirects out to Invoicing's own create-credit-note route.
    const handleCreateCreditNote = () => {
        navigate(`/${paths.invoice.index}/${paths.invoice.creditNoteCreate}?invoiceId=${id}`);
    };

    let previewContent = <DocumentEmptyState />;

    if (isPreviewLoading) {
        previewContent = (
            <Flex align="center" justify="center" className="w-full min-h-[400px] lg:min-h-[720px] bg-[#F8FAFC] rounded-xl">
                <Spin />
            </Flex>
        );
    } else if (documentHtml) {
        previewContent = <ResponsiveHtmlPreview html={documentHtml} title={documentLabel} />;
    }

    return (
        <Flex vertical className="w-full pt-3" gap={16}>
            {/* Header */}
            <Flex justify="space-between" align="center" gap={12} className="flex-wrap sm:flex-nowrap">
                <Typography.Title level={4} className="!mb-0 shrink-0">
                    {documentLabel} Details
                </Typography.Title>
                <Flex gap={8} align="center">
                    <Button
                        icon={<DownloadOutlined />}
                        loading={isDownloading}
                        onClick={() => downloadPdf(id)}
                    >
                        Download PDF
                    </Button>
                    {!isQuotation && (
                        <Button
                            type="primary"
                            danger
                            icon={<ShareAltOutlined />}
                            loading={isSharing}
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            {`Share ${documentLabel}`}
                        </Button>
                    )}
                </Flex>
            </Flex>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Document preview */}
                <div>{previewContent}</div>

                {/* Right: Actions & Details */}
                <Flex vertical gap={16}>
                    {isQuotation ? (
                        <>
                            <Flex gap={12}>
                                <Button
                                    className="flex-1"
                                    icon={<ShareAltOutlined />}
                                    loading={isSharing}
                                    onClick={() => setIsShareModalOpen(true)}
                                >
                                    Send to Customer
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    className="flex-1"
                                    onClick={() =>
                                        navigate(
                                            `/${paths.invoice.index}/${paths.invoice.create}?fromQuotation=${id}`
                                        )
                                    }
                                >
                                    Convert to Invoice
                                </Button>
                            </Flex>

                            <QuotationTimeline documentData={documentData} />
                        </>
                    ) : (
                        <>
                            {isSalesOrder && (
                                <ConvertDocumentCard
                                    title="Convert to Invoice"
                                    description="Turn this sales order into an invoice to bill your customer."
                                    onConvert={() =>
                                        navigate(
                                            `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.createInvoice}`,
                                            { state: { fromSalesOrderId: id } }
                                        )
                                    }
                                />
                            )}

                            {isInvoice && documentData?.status !== 'PAID' && (
                                <DocumentActionsCard
                                    isGeneratingLink={loadingKey === 'payment-link'}
                                    onGeneratePaymentLink={() => handleSelect('payment-link')}
                                    documentStatus={documentData?.status}
                                />
                            )}

                            <DocumentTimeline documentData={documentData} documentType={documentType} />
                        </>
                    )}

                    {/* Invoice-only: paid-vs-total progress, payment history, delete, receipts */}
                    {isInvoice && (
                        <PaymentSection
                            documentTotal={Number(documentData?.totalAmount ?? 0)}
                            totalPaid={Number(documentData?.amountPaid ?? 0)}
                            amountDue={Number(documentData?.amountDue ?? 0)}
                            paymentHistory={paymentHistory}
                            onAddPayment={values => addPayment({ ...values, amount: Number(values.amount) })}
                            onDeletePayment={deletePayment}
                            onDownloadReceipt={downloadReceipt}
                            onShareReceipt={shareReceipt}
                            isDownloadingReceipt={isDownloadingReceipt}
                            isSharingReceipt={isSharingReceipt}
                            receiptContext={{
                                documentNo: `${documentData?.prefix ?? ''}${documentData?.documentNumber ?? ''}`,
                                currency: documentData?.currency ?? 'INR',
                                customerName: documentData?.name ?? '',
                                customerEmail: documentData?.email ?? '',
                                customerPhone: documentData?.phoneNumber ?? '',
                                billerName,
                            }}
                            isLoading={isLoading}
                        />
                    )}

                    {/* Invoice-only: read-only credit note list + redirect to Invoicing */}
                    {isInvoice && (
                        <CreditNoteSection
                            creditNotes={creditNotes}
                            onCreateCreditNote={handleCreateCreditNote}
                        />
                    )}

                    <PaymentTimelineAndDetails
                        documentData={documentData}
                        documentLabel={documentLabel}
                        onMarkCompleted={
                            isSalesOrder && documentData?.status !== 'COMPLETED'
                                ? () => markAsCompleted(documentData?.id)
                                : undefined
                        }
                        isMarkingComplete={isMarkingComplete}
                        isLoading={isLoading}
                    />
                </Flex>
            </div>

            {isInvoice && documentData?.id && (
                <InvoiceRemindersSection
                    key={documentData.id}
                    invoiceId={Number(documentData.id)}
                    status={documentData?.status}
                    invoiceDetails={{
                        invoiceNo: `${documentData?.prefix ?? ''}${documentData?.documentNumber ?? ''}`,
                        dueDate: documentData?.dueDate,
                    }}
                    paymentDetails={{ amountDue: documentData?.amountDue }}
                    recipientDetails={{
                        customerName: documentData?.name,
                        customerPhone: documentData?.phoneNumber,
                        customerEmail: documentData?.email,
                    }}
                />
            )}

            <PaymentLinkModal
                open={activeModal === 'payment-link'}
                onCancel={() => setActiveModal(null)}
                documentData={{
                    id: documentData?.id ? Number(documentData.id) : undefined,
                    amount: documentData?.amountDue,
                    customerName: documentData?.name,
                    customerPhone: documentData?.phoneNumber,
                }}
            />

            <ShareDocumentModal
                open={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                customerEmail={isSalesOrder ? '' : documentData?.email}
                onSend={email => shareDocument(id, email)}
                isSending={isSharing}
                documentLabel={documentLabel}
            />
        </Flex>
    );
};

export default DocumentDetails;
