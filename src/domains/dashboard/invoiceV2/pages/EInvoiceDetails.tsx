import React from 'react';

import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Tag } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';

import truckDeliveryIcon from '../assets/icons/eInvoice/truck-delivery.svg';
import CancelEWaybillModal from '../components/eInvoiceDetails/CancelEWaybillModal';
import CancelIrnModal from '../components/eInvoiceDetails/CancelIrnModal';
import EInvoiceDetailsSkeleton from '../components/eInvoiceDetails/EInvoiceDetailsSkeleton';
import EWaybillCard from '../components/eInvoiceDetails/EWaybillCard';
import IrnField from '../components/eInvoiceDetails/IrnField';
import QrCode from '../components/eInvoiceDetails/QrCode';
import AlertCard from '../components/shared/AlertCard';
import LabelValueRow from '../components/shared/LabelValueRow';
import ReviewCard from '../components/shared/ReviewCard';
import { TABLE_HEADER_STYLE } from '../constants/style';
import useEInvoiceDetails from '../hooks/eInvoiceDetails/useEInvoiceDetails';
import { formatAmount } from '../utils/helperFunctions';
import reviewIrnColumns from '../utils/table_column/reviewIrnColumns';

const EInvoiceDetails: React.FC = () => {
    const { id: invoiceId = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const {
        detail,
        isLoading,
        cancelIrnOpen,
        setCancelIrnOpen,
        cancelEWaybillOpen,
        setCancelEWaybillOpen,
        cancelIrn,
        cancelEWaybill,
        downloadPdf,
        isDownloading,
        canCancelIrn,
        irnWindowExpired,
        ewbWindowExpired,
        hasActiveEWaybill,
        irnActive,
    } = useEInvoiceDetails(invoiceId);

    if (isLoading || !detail) {
        return (
            <Content className="px-0">
                <EInvoiceDetailsSkeleton />
            </Content>
        );
    }

    const isCancelled = detail.status === 'CANCELLED';
    const totalTax = detail.lineItems.reduce((s, it) => s + it.tax, 0);

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                gap={20}
                className="mb-7 flex-col lg:flex-row"
            >
                <Flex vertical gap={4}>
                    <Flex align="center" gap={10} wrap="wrap">
                        <TypographyText className="text-xl md:text-2xl font-semibold">
                            {detail.gstin}
                        </TypographyText>
                        <Flex gap={6} align="center">
                            <Tag
                                color={isCancelled ? 'error' : 'success'}
                                className="rounded-full px-3 py-0 m-0 text-sm"
                            >
                                {isCancelled ? 'Cancelled' : 'Active'}
                            </Tag>
                            <Tag className="rounded-full px-3 py-0 m-0 text-sm bg-[#F4F4F5] text-[#374151]">
                                {detail.docType}
                            </Tag>
                            <Tag color="purple" className="rounded-full px-3 py-0 m-0 text-sm">
                                {detail.supplyType}
                            </Tag>
                        </Flex>
                    </Flex>
                    <TypographyText className="text-[#6B7280] text-sm">
                        Dated: {detail.dated} · Generated: {detail.generated}
                    </TypographyText>
                </Flex>

                <Flex gap={10} wrap="wrap" className="w-full lg:w-auto">
                    {/* Cancel E-Waybill or Cancel IRN — never both */}
                    {/* {canCancelEWaybill && (
                        <Button
                            icon={<CloseCircleOutlined />}
                            className="h-10 flex-1 lg:flex-none border-[#FF4F4F] text-[#FF4F4F] hover:!text-[#e03e3e] hover:!border-[#e03e3e]"
                            onClick={() => setCancelEWaybillOpen(true)}
                        >
                            Cancel E-Waybill
                        </Button>
                    )} */}
                    {canCancelIrn && (
                        <Button
                            icon={<CloseCircleOutlined />}
                            className="h-10 flex-1 lg:flex-none border-[#FF4F4F] text-[#FF4F4F] bg-[#FFF1F1] hover:!text-[#e03e3e] hover:!border-[#e03e3e]"
                            onClick={() => setCancelIrnOpen(true)}
                        >
                            Cancel IRN
                        </Button>
                    )}
                    {(irnWindowExpired || ewbWindowExpired) && (
                        <Button
                            icon={<ClockCircleOutlined />}
                            disabled
                            className="h-10 flex-1 lg:flex-none"
                        >
                            24h window expired
                        </Button>
                    )}

                    {/* Generate E-Waybill — only when IRN active and no active EWB */}
                    {irnActive && !hasActiveEWaybill && (
                        <Button
                            type="primary"
                            danger
                            icon={<ReactSVG src={truckDeliveryIcon} />}
                            className="h-10 flex-1 lg:flex-none"
                            onClick={() =>
                                navigate(
                                    `/${paths.invoice.index}/${paths.invoice.eInvoicingWaybill}`,
                                    { state: { preselectedInvoiceId: invoiceId } }
                                )
                            }
                        >
                            Generate E-Waybill
                        </Button>
                    )}

                    {/* Download — always shown */}
                    <Button
                        icon={<DownloadOutlined />}
                        className="h-10 flex-1 lg:flex-none border-[#D1D5DB] text-[#374151]"
                        onClick={downloadPdf}
                        loading={isDownloading}
                    >
                        Download
                    </Button>
                </Flex>
            </Flex>

            <Flex vertical gap={20}>
                {/* Cancellation alert */}
                {isCancelled && (
                    <AlertCard
                        variant="error"
                        title="IRN Cancelled"
                        cancelledOn={detail.cancelledDate ?? undefined}
                        reason={detail.cancelReason ?? undefined}
                        description={detail.cancelRemark ?? undefined}
                    />
                )}

                {/* IRN Details */}
                <Flex
                    vertical
                    gap={16}
                    className="bg-white border border-[#E4E4E7] rounded-2xl p-5 md:p-6"
                >
                    <Flex justify="space-between" align="center">
                        <TypographyText className="text-base font-semibold">
                            IRN Details
                        </TypographyText>
                        <CheckCircleOutlined className="text-base text-[#12B76A]" />
                    </Flex>
                    <Row gutter={[16, 14]}>
                        <Col xs={24} md={12}>
                            <IrnField
                                label="Invoice Reference Number (IRN)"
                                value={detail.irnHash}
                                copyable
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <IrnField
                                label="Acknowledgement Number"
                                value={detail.irnAck}
                                copyable
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <IrnField label="Acknowledgement Date" value={detail.ackDate} />
                        </Col>
                        <Col xs={24} md={12}>
                            <IrnField
                                label="Signed Invoice (JWS)"
                                value={detail.signedJws}
                                copyable
                            />
                        </Col>
                    </Row>
                </Flex>

                {/* E-Waybill card */}
                {detail.eWaybill && <EWaybillCard data={detail.eWaybill} />}

                {/* Transaction / Seller / Buyer */}
                <Row gutter={[12, 12]}>
                    <Col xs={24} lg={8}>
                        <ReviewCard title="Transaction" rows={detail.transaction} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <ReviewCard title="Seller" rows={detail.seller} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <ReviewCard title="Buyer" rows={detail.buyer} />
                    </Col>
                </Row>

                {/* QR Code */}
                <QrCode value={detail.signedQRCode} />

                {/* Line Items */}
                <Flex vertical gap={6}>
                    <TypographyText className="text-sm font-semibold">
                        Line Items ({detail.lineItems.length})
                    </TypographyText>
                    <Flex
                        vertical
                        className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4]"
                    >
                        <Flex vertical className="[&>div:first-child]:hidden">
                            <GenericTable
                                dataSource={detail.lineItems}
                                columns={reviewIrnColumns(detail.useIgst)}
                                rowKey="id"
                                pagination={false}
                                components={{
                                    header: {
                                        cell: ({
                                            style,
                                            ...rest
                                        }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                            <th
                                                {...rest}
                                                style={{ ...style, ...TABLE_HEADER_STYLE }}
                                            />
                                        ),
                                    },
                                }}
                            />
                        </Flex>
                        <Flex className="px-5 py-4 bg-[#F9FAFB] flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <TypographyText className="text-sm font-semibold">
                                Value Summary
                            </TypographyText>
                            <Flex vertical gap={8} className="w-full sm:w-auto sm:min-w-[380px]">
                                <LabelValueRow
                                    label="Taxable Value"
                                    value={formatAmount(detail.totalTaxable)}
                                />
                                <LabelValueRow
                                    label={
                                        detail.useIgst ? 'Total IGST' : 'Total Tax (CGST + SGST)'
                                    }
                                    value={formatAmount(totalTax)}
                                />
                                <Divider className="my-0" />
                                <LabelValueRow
                                    label="Invoice Total"
                                    value={formatAmount(detail.totalAmount)}
                                    bold
                                />
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>

            <CancelIrnModal
                open={cancelIrnOpen}
                onClose={() => setCancelIrnOpen(false)}
                onConfirm={cancelIrn}
            />
            <CancelEWaybillModal
                open={cancelEWaybillOpen}
                onClose={() => setCancelEWaybillOpen(false)}
                onConfirm={cancelEWaybill}
            />
        </Content>
    );
};

export default EInvoiceDetails;
