import { useRef, useState } from 'react';

import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getBankAccountsApi } from '../api/manageBankAccount';
import InvoiceRemindersSection from '../components/invoice/view/InvoiceRemindersSection';
import BankTransferModal from '../components/invoiceDetails/BankTransferModal';
import CreditNoteSection from '../components/invoiceDetails/CreditNoteSection';
import ENACHMandateModal from '../components/invoiceDetails/eNACHMandate/ENACHMandateModal';
import InvoiceActionsCard from '../components/invoiceDetails/InvoiceActionsCard';
import InvoiceEmptyState from '../components/invoiceDetails/InvoiceEmptyState';
import InvoiceTimeline from '../components/invoiceDetails/InvoiceTimeline';
import PaymentLinkModal from '../components/invoiceDetails/PaymentLinkModal.tsx';
import PaymentSection from '../components/invoiceDetails/PaymentSection';
import PaymentTimelineAndDetails from '../components/invoiceDetails/PaymentTimelineAndDetails';
import QuotationDetailsPanel from '../components/invoiceDetails/QuotationDetailsPanel';
import ResponsiveHtmlPreview from '../components/invoiceDetails/ResponsiveHtmlPreview';
import ShareInvoiceModal from '../components/invoiceDetails/ShareInvoiceModal';
import SendUPICollectModal from '../components/invoiceDetails/upiCollect/SendUPICollectModal';
import VirtualAccountModal from '../components/invoiceDetails/VirtualAccountModal';
import ManageBankAccountsModal from '../components/manageBankAccounts/ManageBankAccountsModal';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import useInvoiceDetails from '../hooks/invoiceDetails/useInvoiceDetails';
import useOnboarding from '../hooks/useOnboarding';
import { CollectPaymentKey } from '../types/invoiceDetails';
import { DomesticAccount } from '../types/ManageBankAccounts';

const ONBOARDING_REQUIRED = ['payment-link'];

const InvoiceDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const {
        invoiceData,
        isLoading,
        isPreviewLoading,
        downloadPdf,
        isDownloading,
        sendEmail,
        isSendingEmail,
        invoiceHtml,
        paymentHistory,
        creditNotes,
        addPayment,
        deletePayment,
        updateCreditNoteStatus,
        downloadReceipt,
        shareReceipt,
        isDownloadingReceipt,
        isSharingReceipt,
        billerName,
    } = useInvoiceDetails(id);
    const { checkOnboardingStatus } = useOnboarding();

    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isBankAccountsOpen, setIsBankAccountsOpen] = useState(false);
    const [openAddDomesticForm, setOpenAddDomesticForm] = useState(false);
    const [loadingMethod, setLoadingMethod] = useState<CollectPaymentKey | null>(null);
    const [cachedOnboardingStatus, setCachedOnboardingStatus] = useState<boolean | null>(null);
    const [primaryAccount, setPrimaryAccount] = useState<DomesticAccount | null>(null);
    const hasFetchedBank = useRef(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const handleSelect = async (key: CollectPaymentKey) => {
        if (loadingMethod) return;

        if (key === 'bank') {
            if (!hasFetchedBank.current) {
                setLoadingMethod('bank');
                try {
                    const resp = await getBankAccountsApi({ userId, userType: role });
                    if (resp && resp.status) {
                        const accounts: DomesticAccount[] = resp.data ?? [];
                        setPrimaryAccount(
                            accounts.find(a => a.default === 1) ?? accounts[0] ?? null
                        );
                    }
                    hasFetchedBank.current = true;
                } finally {
                    setLoadingMethod(null);
                }
            }
            setActiveModal('bank');
            return;
        }

        if (ONBOARDING_REQUIRED.includes(key)) {
            let isOnboarded = cachedOnboardingStatus;
            if (isOnboarded === null) {
                setLoadingMethod(key);
                try {
                    const result = await checkOnboardingStatus();
                    ({ isOnboarded } = result);
                    setCachedOnboardingStatus(isOnboarded);
                } finally {
                    setLoadingMethod(null);
                }
            }
            if (!isOnboarded) {
                navigate(paths.dashboard.paymentLinks);
                return;
            }
        }
        setActiveModal(key);
    };

    const handleCreateCreditNote = () => {
        const creditedQtyByItemId: Record<string, number> = {};
        creditNotes.forEach(cn => {
            (cn.items || []).forEach(item => {
                if (!item.itemId) return;
                creditedQtyByItemId[item.itemId] =
                    (creditedQtyByItemId[item.itemId] || 0) + (parseFloat(item.quantity) || 0);
            });
        });

        const hasCreditableItems = (invoiceData?.items || []).some(item => {
            if (!item.itemId) return false;
            const original = parseFloat(item.quantity) || 0;
            const credited = creditedQtyByItemId[item.itemId] || 0;
            return original - credited > 0;
        });

        if (!hasCreditableItems) {
            dispatch(
                showToast({
                    description:
                        'This invoice has already been fully credited — there is nothing left to credit.',
                    variant: 'error',
                })
            );
            return;
        }

        navigate(`/${paths.invoice.index}/${paths.invoice.creditNoteCreate}?invoiceId=${id}`);
    };

    let previewContent = <InvoiceEmptyState />;

    if (isPreviewLoading) {
        previewContent = (
            <Flex align="center" justify="center" className="w-full min-h-[720px] bg-[#F8FAFC]">
                <Spin />
            </Flex>
        );
    } else if (invoiceHtml) {
        previewContent = <ResponsiveHtmlPreview html={invoiceHtml} />;
    }

    const isQuotationMode = invoiceData?.documentType === 'QUOTATION';

    return (
        <Flex vertical className="w-full pt-3" gap={16}>
            {/* Header */}
            <Flex
                justify="space-between"
                align="center"
                gap={12}
                className="flex-wrap sm:flex-nowrap"
            >
                <Typography.Title level={4} className="!mb-0 shrink-0">
                    {isQuotationMode ? 'Quotation Details' : 'Invoice Details'}
                </Typography.Title>
                <Flex gap={8} align="center">
                    <Button
                        icon={<DownloadOutlined />}
                        loading={isDownloading}
                        onClick={() => downloadPdf(id)}
                    >
                        Download PDF
                    </Button>
                    {!isQuotationMode && (
                        <Button
                            type="primary"
                            danger
                            icon={<ShareAltOutlined />}
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            Share Invoice
                        </Button>
                    )}
                </Flex>
            </Flex>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: document preview */}
                <div>{previewContent}</div>

                {/* Right: Actions & Details */}
                <Flex vertical gap={16}>
                    {isQuotationMode ? (
                        <QuotationDetailsPanel
                            invoiceData={invoiceData}
                            isLoading={isLoading}
                            onSendQuotation={() => setIsShareModalOpen(true)}
                            isSending={isSendingEmail}
                        >
                            <PaymentTimelineAndDetails
                                invoiceData={invoiceData}
                                isLoading={isLoading}
                            />
                        </QuotationDetailsPanel>
                    ) : (
                        <>
                            <InvoiceActionsCard
                                isGeneratingLink={loadingMethod === 'payment-link'}
                                onGeneratePaymentLink={() => handleSelect('payment-link')}
                                invoiceStatus={invoiceData?.status}
                            />

                            <InvoiceTimeline invoiceData={invoiceData} />

                            <PaymentSection
                                invoiceTotal={Number(
                                    invoiceData?.originalTotalAmount ??
                                        invoiceData?.totalAmount ??
                                        0
                                )}
                                totalPaid={Number(
                                    invoiceData?.originalAmountPaid ?? invoiceData?.amountPaid ?? 0
                                )}
                                amountDue={Number(
                                    invoiceData?.originalAmountDue ?? invoiceData?.amountDue ?? 0
                                )}
                                currency={invoiceData?.currency ?? 'INR'}
                                paymentHistory={paymentHistory}
                                onAddPayment={values =>
                                    addPayment({ ...values, amount: Number(values.amount) })
                                }
                                onDeletePayment={deletePayment}
                                onDownloadReceipt={downloadReceipt}
                                onShareReceipt={shareReceipt}
                                isDownloadingReceipt={isDownloadingReceipt}
                                isSharingReceipt={isSharingReceipt}
                                receiptContext={{
                                    invoiceNo: invoiceData?.invoiceNumber ?? '',
                                    currency: invoiceData?.currency ?? 'INR',
                                    customerName: invoiceData?.name ?? '',
                                    customerEmail: invoiceData?.email ?? '',
                                    customerPhone: invoiceData?.phoneNumber ?? '',
                                    billerName,
                                }}
                                isLoading={isLoading}
                            />

                            <CreditNoteSection
                                creditNotes={creditNotes}
                                onCreateCreditNote={handleCreateCreditNote}
                                onUpdateStatus={updateCreditNoteStatus}
                            />

                            <PaymentTimelineAndDetails
                                invoiceData={invoiceData}
                                isLoading={isLoading}
                            />
                        </>
                    )}
                </Flex>
            </div>

            {!isQuotationMode && invoiceData?.id && (
                <InvoiceRemindersSection
                    key={invoiceData.id}
                    invoiceId={Number(invoiceData.id)}
                    status={invoiceData?.status}
                    invoiceDetails={{
                        invoiceNo: `${invoiceData?.prefix ?? ''}${invoiceData?.invoiceNumber ?? ''}`,
                        dueDate: invoiceData?.dueDate,
                    }}
                    paymentDetails={{ amountDue: invoiceData?.amountDue }}
                    recipientDetails={{
                        customerName: invoiceData?.name,
                        customerPhone: invoiceData?.phoneNumber,
                        customerEmail: invoiceData?.email,
                    }}
                />
            )}

            <PaymentLinkModal
                open={activeModal === 'payment-link'}
                onCancel={() => setActiveModal(null)}
                invoiceData={{
                    id: invoiceData?.id ? Number(invoiceData.id) : undefined,
                    amount: invoiceData?.amountDue,
                    customerName: invoiceData?.name,
                    customerPhone: invoiceData?.phoneNumber,
                }}
            />

            <SendUPICollectModal
                open={activeModal === 'upi'}
                onCancel={() => setActiveModal(null)}
                onSuccess={() => setActiveModal(null)}
                onSwitchToPaymentLink={() => setActiveModal('payment-link')}
                invoiceData={{ amount: invoiceData?.amountDue }}
            />

            <BankTransferModal
                open={activeModal === 'bank'}
                onCancel={() => setActiveModal(null)}
                details={primaryAccount}
                onAddBankAccount={() => {
                    setActiveModal(null);
                    setOpenAddDomesticForm(true);
                    setIsBankAccountsOpen(true);
                }}
            />

            <ENACHMandateModal
                open={activeModal === 'enach'}
                onCancel={() => setActiveModal(null)}
                onSuccess={() => setActiveModal(null)}
                invoiceData={{
                    customerName: invoiceData?.name,
                    customerEmail: invoiceData?.email,
                    customerPhone: invoiceData?.phoneNumber,
                }}
            />

            <VirtualAccountModal
                open={activeModal === 'virtual-iban'}
                onCancel={() => setActiveModal(null)}
                details={{
                    invoiceNo: invoiceData?.invoiceNumber,
                    companyName: invoiceData?.name,
                }}
            />

            <OnboardingModal
                open={activeModal === 'currency-account'}
                onCancel={() => setActiveModal(null)}
                type="currency-account"
            />

            <ManageBankAccountsModal
                open={isBankAccountsOpen}
                onClose={() => {
                    setIsBankAccountsOpen(false);
                    setOpenAddDomesticForm(false);
                    hasFetchedBank.current = false;
                }}
                virtualAccounts={[]}
                isVirtualAccountsLoading={false}
                openAddForm={openAddDomesticForm}
            />

            <ShareInvoiceModal
                open={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                customerEmail={invoiceData?.email}
                onSend={email => sendEmail(id, email)}
                isSending={isSendingEmail}
                isQuotation={isQuotationMode}
            />
        </Flex>
    );
};

export default InvoiceDetails;
