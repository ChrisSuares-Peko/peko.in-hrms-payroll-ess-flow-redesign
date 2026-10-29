import React from 'react';

import { Col, Flex, Row, Statistic, Tooltip, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface PriceInfoCardProps {
    bgColor: string;
    icon: any;
    title: string;
    value: string | number;
    currency: string;
    reference?: React.MutableRefObject<null>;
}
const DashboardCard2 = ({
    bgColor,
    icon,
    title,
    value,
    currency,
    reference,
}: PriceInfoCardProps) => {
    const { Text } = Typography;
    return (
        <Flex
            ref={reference}
            className={`${bgColor} rounded-2xl py-4 pl-6 pr-4 flex-1 h-28 items-center`}
            gap={16}
        >
            <Row className="w-full" gutter={15}>
                <Col span={4} className="flex items-center">
                    <Flex className="w-8 h-8 bg-white rounded-full" align="center" justify="center">
                        <ReactSVG src={icon} data-testid="icon-svg" />
                    </Flex>
                </Col>
                <Col span={20}>
                    <Flex gap={3} className="pl-6" justify="end" align="end">
                        <Flex vertical>
                            <Text className="text-xs font-normal whitespace-nowrap overflow-hidden truncate">
                                <Tooltip title={title}>{title}</Tooltip>
                            </Text>
                            <Text className="text-base font-semibold whitespace-nowrap">
                                <Tooltip title={`${currency} ${value}`}>
                                    <Statistic
                                        prefix={
                                            <Text className="text-xs font-normal">{currency}</Text>
                                        }
                                        data-testid="amount"
                                        value={value}
                                        className="-mt-3 collector-dashboard overflow-hidden"
                                    />
                                </Tooltip>
                            </Text>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
        </Flex>
    );
};

export default DashboardCard2;
