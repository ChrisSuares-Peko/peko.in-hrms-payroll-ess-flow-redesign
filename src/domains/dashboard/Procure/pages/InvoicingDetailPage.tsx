import React from 'react';


import { Button, Card, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import InvoiceDocumentsCard from '../components/InvoicingDetails/InvoiceDocumentsCard';
import InvoiceInfoCard from '../components/InvoicingDetails/InvoiceInfoCard';
import LinkedPOCard from '../components/InvoicingDetails/LinkedPOCard';
import PaymentContextCard from '../components/InvoicingDetails/PaymentContextCard';
import RelatedInvoicesCard from '../components/InvoicingDetails/RelatedInvoicesCard';
import { useInvoice } from '../hooks/useInvoice';

const { Text } = Typography;

const InvoicingDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { invoiceId } = useParams<{ invoiceId: string }>();

    const { detail, isLoading } = useInvoice(undefined, invoiceId);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.invoicing.index}`);

    if (isLoading) {
        return (
            <Card styles={{ body: { padding: 'clamp(16px, 4vw, 40px)' } }} className="rounded-3xl">
                <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
        );
    }

    return (
        <Row gutter={[24, 24]} align="top">
            <Col xs={24} xl={16}>
                <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
                    <Flex vertical gap={24}>
                        <Flex vertical align="center" gap={4}>
                            <Text className="block text-center text-2xl font-medium text-[rgba(0,0,0,0.88)]">
                                {detail?.invoiceNumber ?? invoiceId}
                            </Text>
                            <Text className="text-center text-sm font-normal text-[#000000]">
                                {detail?.purchaseOrder?.vendor?.businessName ?? '—'}
                                {detail?.purchaseOrder?.refNumber ? ` · Linked to ${detail.purchaseOrder.refNumber}` : ''}
                            </Text>
                        </Flex>

                        <InvoiceInfoCard detail={detail} />
                        <InvoiceDocumentsCard attachments={detail?.attachments ?? []} />
                        <RelatedInvoicesCard poRef={detail?.purchaseOrder?.refNumber} poId={detail?.purchaseOrder?.id} />

                        <Flex justify="flex-start">
                            <Button size="small" danger variant="outlined" className="!rounded-lg !h-10 !px-6" onClick={handleCancel}>Back</Button>
                        </Flex>
                    </Flex>
                </Card>
            </Col>

            <Col xs={24} xl={8}>
                <Flex vertical gap={24}>
                    <LinkedPOCard purchaseOrder={detail?.purchaseOrder} />
                    <PaymentContextCard detail={detail} />
                </Flex>
            </Col>
        </Row>
    );
};

export default InvoicingDetailPage;
