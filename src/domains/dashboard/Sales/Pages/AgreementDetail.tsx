import { useState } from 'react';

import {
    DownloadOutlined,
    EditOutlined,
    PrinterOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { Button, Flex, Tag } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate, useParams } from 'react-router-dom';

import TypographyText from '@components/atomic/typography/typographyText';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { resendESignInvitationApi } from '../api/agreements';
import ActivityTimelineCard from '../components/agreementDetails/ActivityTimelineCard';
import AgreementDetailSkeleton from '../components/agreementDetails/AgreementDetailSkeleton';
import AgreementSummaryCard from '../components/agreementDetails/AgreementSummaryCard';
import CustomerInformationCard from '../components/agreementDetails/CustomerInformationCard';
import SignatureStatusCard from '../components/agreementDetails/SignatureStatusCard';
import PDFViewer from '../components/shared/PDFViewer';
import { mapAgreementStatus } from '../constants/agreement';
import { AGREEMENT_STATUS_STYLE } from '../constants/style';
import useAgreementActions from '../hooks/agreement/useAgreementActions';
import useAgreementDetail from '../hooks/agreement/useAgreementDetail';

dayjs.extend(relativeTime);

const AgreementDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { agreement, isLoading, pdfFile } = useAgreementDetail(id);
    const { downloadAgreement, isDownloading } = useAgreementActions();
    const [isResending, setIsResending] = useState(false);

    const displayId = agreement
        ? `${agreement.prefix ?? ''}${agreement.agreementNumber}`
        : (id ?? '-');
    const status = agreement ? mapAgreementStatus(agreement.status) : 'Draft';
    const statusStyle = AGREEMENT_STATUS_STYLE[status] ?? AGREEMENT_STATUS_STYLE.Draft;
    const contractType = agreement?.contractType ?? '-';
    const lastUpdated = agreement ? dayjs(agreement.updatedAt).fromNow() : '-';
    const customerName = agreement?.invoiceCustomerV2?.name ?? '-';
    const startDate = agreement?.startDate ? dayjs(agreement.startDate).format('MMM D, YYYY') : '-';
    const linkedQuotation = agreement?.quotation?.invoiceNumber ?? '-';
    const customer = agreement?.invoiceCustomerV2 ?? null;
    const customerAddress = customer
        ? [
              customer.primaryAddress,
              customer.primaryCity,
              customer.primaryState,
              customer.primaryPincode,
              customer.primaryCountry,
          ]
              .filter(Boolean)
              .join('\n ')
        : null;

    const handleEdit = () => navigate(`/sales/agreements/${id}/edit`, { state: { step: 4 } });

    const handleResend = async () => {
        if (!agreement?.eSign?.id || !agreement?.eSign?.signers_info?.[0]) return;

        const signer = agreement.eSign.signers_info[0];
        if (!signer.signer_email || !signer.signer_name) return;

        setIsResending(true);
        try {
            const resp = await resendESignInvitationApi(agreement.eSign.id, {
                userId,
                userType,
                email: signer.signer_email,
                name: signer.signer_name,
            });

            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Invitation resent successfully',
                        variant: 'success',
                    })
                );
            } else if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Failed to resend invitation',
                        variant: 'error',
                    })
                );
            }
        } finally {
            setIsResending(false);
        }
    };

    const handlePrint = () => {
        if (!agreement?.documentUrl) return;

        const printWindow = window.open(agreement.documentUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    if (isLoading) return <AgreementDetailSkeleton />;

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                className="mt-4 mb-6"
                wrap="wrap"
                gap={12}
            >
                <Flex vertical gap={4}>
                    <Flex align="center" gap={8} wrap="wrap">
                        <TypographyText className="text-xl font-semibold">
                            {displayId}
                        </TypographyText>
                        <TypographyText className="text-xl font-normal">
                            —{customerName}
                        </TypographyText>
                        <Tag
                            className="rounded-full border-0 text-xs font-medium px-3 py-0.5"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                            {status}
                        </Tag>
                    </Flex>
                    <TypographyText className="text-sm text-gray-500">
                        {contractType} • Last updated {lastUpdated}
                    </TypographyText>
                </Flex>

                <Flex gap={8} wrap="wrap">
                    <Button
                        icon={<EditOutlined />}
                        className="h-9 px-4 rounded-lg border-[#FF4F4F] text-[#FF4F4F] text-sm font-medium"
                        onClick={handleEdit}
                    >
                        Edit
                    </Button>
                    {status === 'Pending' ? (
                        <Button
                            icon={<SendOutlined />}
                            className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[#42526D] text-sm font-medium"
                            onClick={handleEdit}
                        >
                            Send
                        </Button>
                    ) : (
                        <Button
                            icon={<SendOutlined />}
                            className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[#42526D] text-sm font-medium"
                            onClick={handleResend}
                            loading={isResending}
                            disabled={!agreement?.eSign?.id}
                        >
                            Resend
                        </Button>
                    )}
                    <Button
                        icon={<DownloadOutlined />}
                        className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[#42526D] text-sm font-medium"
                        loading={isDownloading}
                        onClick={() =>
                            downloadAgreement(
                                id ?? '',
                                `${displayId} — ${customerName}`
                            )
                        }
                    >
                        Download
                    </Button>
                    <Button
                        icon={<PrinterOutlined />}
                        className="h-9 px-4 rounded-lg border-[#E5E7EB] text-[#42526D] text-sm font-medium"
                        onClick={handlePrint}
                        disabled={!agreement?.documentUrl}
                    >
                        Print
                    </Button>
                </Flex>
            </Flex>

            {/* Body */}
            <Flex className="w-full gap-6 flex-col lg:flex-row lg:items-start">
                {/* Left column */}
                <Flex vertical className="flex-1 min-w-0 gap-6">
                    <AgreementSummaryCard
                        displayId={displayId}
                        customerName={customerName}
                        linkedQuotation={linkedQuotation}
                        startDate={startDate}
                        contractType={contractType}
                    />
                    {pdfFile && (
                        <PDFViewer
                            file={pdfFile}
                            showPageSelector={false}
                            fileName={`${displayId} — ${customerName}`}
                        />
                    )}
                </Flex>

                {/* Right column */}
                <Flex vertical className="w-full lg:w-[360px] lg:shrink-0 gap-6">
                    <CustomerInformationCard
                        customerName={customerName}
                        email={customer?.email ?? '-'}
                        phone={customer?.phoneNumber ?? '-'}
                        gstin={customer?.gstin}
                        address={customerAddress}
                    />
                    <SignatureStatusCard
                        customerName={customerName}
                        eSignId={agreement?.eSign?.id}
                        eSignStatus={agreement?.eSign?.status}
                    />
                    <ActivityTimelineCard timeline={agreement?.timeline ?? []} />
                </Flex>
            </Flex>
        </Content>
    );
};

export default AgreementDetail;
