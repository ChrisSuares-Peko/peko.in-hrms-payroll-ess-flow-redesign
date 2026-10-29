import React from 'react';

import { Col, Divider, Flex, Row, Typography } from 'antd';

import type { FeatureItem } from '@domains/dashboard/plans/utils/reviewOrderData';

import tickIcon from '../../assets/icons/tickonly.svg';

type Props = {
    features: FeatureItem[];
};

const { Text } = Typography;

const FeatureCell = ({ feature }: { feature: FeatureItem }) => (
    <Flex gap={8} align="start" className="min-w-0">
        <img src={tickIcon} alt="" className="w-3 h-4" />
        <Flex vertical gap={6} className="min-w-0">
            <Text className="text-sm font-medium !text-[#1e293b] leading-[14px]">{feature.name}</Text>
            {feature.description && (
                <Text className="text-sm !text-[#475569] leading-[22px] font-light">{feature.description}</Text>
            )}
        </Flex>
    </Flex>
);

const FeatureGrid = ({ features }: Props) => {
    if (!features.length) return null;

    const rows = Array.from(
        { length: Math.ceil(features.length / 2) },
        (_, i): [FeatureItem, FeatureItem | undefined] => [features[i * 2], features[i * 2 + 1]]
    );

    return (
        <Flex vertical gap={18}>
            {rows.map(([left, right], idx) => (
                <React.Fragment key={idx}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={12}>
                            <FeatureCell feature={left} />
                        </Col>
                        {right && (
                            <Col xs={24} md={12}>
                                <FeatureCell feature={right} />
                            </Col>
                        )}
                    </Row>
                    {idx < rows.length - 1 && <Divider className="!m-0 !border-[#e6e9f5]" />}
                </React.Fragment>
            ))}
        </Flex>
    );
};

export default FeatureGrid;
