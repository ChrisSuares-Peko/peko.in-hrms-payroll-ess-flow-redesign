import React from 'react';

import { Col, Flex, Row, Skeleton } from 'antd';

const FieldSkeleton: React.FC<{ labelWidth?: number; valueWidth?: number }> = ({
    labelWidth = 80,
    valueWidth = 160,
}) => (
    <Flex vertical gap={6}>
        <Skeleton.Input active size="small" style={{ width: labelWidth, height: 12 }} />
        <Skeleton.Input active size="small" style={{ width: valueWidth, maxWidth: '100%' }} />
    </Flex>
);

const SummaryRow: React.FC<{ labelWidth?: number; valueWidth?: number }> = ({
    labelWidth = 120,
    valueWidth = 80,
}) => (
    <Flex justify="space-between">
        <Skeleton.Input active size="small" style={{ width: labelWidth, height: 12 }} />
        <Skeleton.Input active size="small" style={{ width: valueWidth, height: 12 }} />
    </Flex>
);

const CardRow: React.FC = () => (
    <Flex justify="space-between" align="center">
        <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
        <Skeleton.Input active size="small" style={{ width: 120, height: 12 }} />
    </Flex>
);

const EInvoiceDetailsSkeleton: React.FC = () => (
    <Flex vertical gap={20}>
        {/* Header */}
        <Flex
            justify="space-between"
            align="flex-start"
            gap={20}
            className="mb-7 flex-col lg:flex-row"
        >
            <Flex vertical gap={8}>
                <Flex align="center" gap={10} wrap="wrap">
                    <Skeleton.Input active size="default" className="!w-[220px]" />
                    <Flex gap={6}>
                        <Skeleton.Button active size="small" className="!w-[70px] !rounded-full" />
                        <Skeleton.Button active size="small" className="!w-[60px] !rounded-full" />
                        <Skeleton.Button active size="small" className="!w-[60px] !rounded-full" />
                    </Flex>
                </Flex>
                <Skeleton.Input active size="small" className="!w-[260px]" />
            </Flex>
            <Flex gap={10} wrap="wrap" className="w-full lg:w-auto">
                <Skeleton.Button active className="!h-10 !w-[140px]" />
                <Skeleton.Button active className="!h-10 !w-[110px]" />
            </Flex>
        </Flex>

        {/* IRN Details card */}
        <Flex vertical gap={16} className="bg-white border border-[#E4E4E7] rounded-2xl p-5 md:p-6">
            <Flex justify="space-between" align="center">
                <Skeleton.Input active size="small" className="!w-[120px]" />
                <Skeleton.Avatar active size={16} shape="circle" />
            </Flex>
            <Row gutter={[16, 14]}>
                <Col xs={24} md={12}>
                    <FieldSkeleton labelWidth={130} valueWidth={200} />
                </Col>
                <Col xs={24} md={12}>
                    <FieldSkeleton labelWidth={130} valueWidth={180} />
                </Col>
                <Col xs={24} md={12}>
                    <FieldSkeleton labelWidth={130} valueWidth={140} />
                </Col>
                <Col xs={24} md={12}>
                    <FieldSkeleton labelWidth={130} valueWidth={220} />
                </Col>
            </Row>
        </Flex>

        {/* Transaction / Seller / Buyer cards */}
        <Row gutter={[12, 12]}>
            <Col xs={24} lg={8}>
                <Flex vertical gap={8} className="rounded-xl border border-[#E4E4E7] p-4 h-full">
                    <Skeleton.Input active size="small" className="!w-[90px]" />
                    <Flex vertical gap={10}>
                        <CardRow />
                        <CardRow />
                        <CardRow />
                        <CardRow />
                    </Flex>
                </Flex>
            </Col>
            <Col xs={24} lg={8}>
                <Flex vertical gap={8} className="rounded-xl border border-[#E4E4E7] p-4 h-full">
                    <Skeleton.Input active size="small" className="!w-[50px]" />
                    <Flex vertical gap={10}>
                        <CardRow />
                        <CardRow />
                        <CardRow />
                        <CardRow />
                    </Flex>
                </Flex>
            </Col>
            <Col xs={24} lg={8}>
                <Flex vertical gap={8} className="rounded-xl border border-[#E4E4E7] p-4 h-full">
                    <Skeleton.Input active size="small" className="!w-[50px]" />
                    <Flex vertical gap={10}>
                        <CardRow />
                        <CardRow />
                        <CardRow />
                        <CardRow />
                    </Flex>
                </Flex>
            </Col>
        </Row>

        {/* QR Code */}
        <Flex
            gap={16}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-5 flex-col sm:flex-row sm:items-center"
        >
            <Skeleton.Image active className="!w-40 !h-40 flex-shrink-0 !rounded-lg" />
            <Flex vertical gap={8}>
                <Skeleton.Input active size="small" className="!w-[130px]" />
                <Skeleton.Input active size="small" className="!w-[260px] !max-w-full" />
                <Skeleton.Button active className="!h-8 !w-[120px]" />
            </Flex>
        </Flex>

        {/* Line Items table */}
        <Flex vertical gap={6}>
            <Skeleton.Input active size="small" className="!w-[120px]" />
            <Flex vertical className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4]">
                {/* Table header */}
                <Flex className="px-4 py-3 bg-[#F9FAFB] border-b border-[#EFF1F4]" gap={16}>
                    <Skeleton.Input active size="small" style={{ width: 100, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 90, height: 12 }} />
                </Flex>
                {/* Table row 1 */}
                <Flex className="px-4 py-4 border-b border-[#EFF1F4]" gap={16} align="center">
                    <Skeleton.Input active size="small" style={{ width: 100, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 90, height: 12 }} />
                </Flex>
                {/* Table row 2 */}
                <Flex className="px-4 py-4 border-b border-[#EFF1F4]" gap={16} align="center">
                    <Skeleton.Input active size="small" style={{ width: 100, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 60, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 80, height: 12 }} />
                    <Skeleton.Input active size="small" style={{ width: 90, height: 12 }} />
                </Flex>
                {/* Value Summary footer */}
                <Flex className="px-5 py-4 bg-[#F9FAFB] flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <Skeleton.Input active size="small" className="!w-[120px]" />
                    <Flex vertical gap={8} className="w-full sm:w-auto sm:min-w-[380px]">
                        <SummaryRow labelWidth={100} valueWidth={80} />
                        <SummaryRow labelWidth={140} valueWidth={70} />
                        <SummaryRow labelWidth={90} valueWidth={90} />
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    </Flex>
);

export default EInvoiceDetailsSkeleton;
