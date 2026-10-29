import React from 'react';

import { Col, Flex, Row, Tag } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { EWaybillData } from '../../types/eInvoiceDetails';

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Flex vertical gap={4}>
        <TypographyText className="text-sm text-[#6B7280]">{label}</TypographyText>
        <TypographyText className="text-sm font-semibold">{value}</TypographyText>
    </Flex>
);

const EWaybillCard: React.FC<{ data: EWaybillData }> = ({ data }) => (
    <Flex vertical gap={16} className="bg-[#F9FAFB] rounded-2xl p-5 md:p-6">
        <Flex align="center" gap={10}>
            <TypographyText className="text-base font-semibold">E-Waybill</TypographyText>
            <Tag color="success" className="rounded-full px-3 py-0 m-0 text-sm">
                {data.status}
            </Tag>
        </Flex>

        <Row gutter={[24, 20]}>
            <Col xs={12} md={8}>
                <Field label="EWB Number" value={data.ewbNumber} />
            </Col>
            <Col xs={12} md={8}>
                <Field label="Generated On" value={data.generatedOn} />
            </Col>
            <Col xs={12} md={8}>
                <Field label="Transport Mode" value={data.transportMode} />
            </Col>
            <Col xs={12} md={8}>
                {data.transportMode.toLowerCase() === 'road' ? (
                    <Field label="Vehicle No" value={data.vehicleNo} />
                ) : (
                    <Field label="Transport Document Number" value={data.transDocNo} />
                )}
            </Col>
            <Col xs={12} md={8}>
                <Field label="Distance (km)" value={data.distance} />
            </Col>
            <Col xs={12} md={8}>
                <Field label="Transporter" value={data.transporter} />
            </Col>
        </Row>
    </Flex>
);

export default EWaybillCard;
