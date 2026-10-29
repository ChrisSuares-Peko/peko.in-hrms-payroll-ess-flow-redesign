import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { formattedDateTime } from '@utils/dateFormat';

import { OrderTableItem } from '../../types';

interface TableProp {
    transaction: OrderTableItem;
}

const TableMobile: React.FC<TableProp> = ({ transaction }) => {
    const { date, amount, billingCycle, plan, status, transactionId } = transaction;
    const formattedDate = formattedDateTime(new Date(date));
    const [showMore, setshowMore] = useState<boolean>(false);

    const details = [
        { label: 'Date', value: formattedDate },
        { label: 'Order ID', value: transactionId },
        { label: 'Billing Cycle', value: billingCycle },
        { label: 'Amount', value: Number(amount).toFixed(2) },
    ];

    const getStatusStyle = (statusValue: string) => {
        switch (statusValue.toLowerCase()) {
            case 'pending':
                return { color: '#C89C00', fontWeight: 'bold' };
            case 'onprogress':
                return { color: '#0000A0', fontWeight: 'bold' };
            default:
                return { color: 'green', fontWeight: 'bold' };
        }
    };

    const getStatusText = (statusValue: string) => {
        switch (statusValue.toLowerCase()) {
            case 'onprogress':
                return 'In Progress';
            case 'complete':
                return 'Completed';
            case 'pending':
                return 'Pending';
            default:
                return statusValue;
        }
    };

    const statusText = getStatusText(status);
    const statusStyle = getStatusStyle(status);

    return (
        <Content className="px-3 py-5 rounded-md">
            <Row>
                <Col span={7}>
                    <Flex justify="start" className="pr-4">
                        <Typography.Text>{formattedDate}</Typography.Text>
                    </Flex>
                </Col>
                <Col span={9} className="pr-4">
                    <Flex justify="start">
                        <Typography.Text>{plan}</Typography.Text>
                    </Flex>
                </Col>
                <Col span={7}>
                    <Flex justify="start">
                        <Typography.Text className="capitalize" style={statusStyle}>
                            {statusText}
                        </Typography.Text>
                    </Flex>
                </Col>
                <Col span={1}>
                    <RightOutlined
                        onClick={() => setshowMore(!showMore)}
                        className={`collapse-icon ${showMore ? 'open' : ''}`}
                    />
                </Col>
            </Row>
            {showMore && (
                <Flex vertical gap={10} className="p-6 mt-5 rounded-md bg-bgLightGray">
                    {details.map(({ value, label }, index) => (
                        <Flex justify="space-between" className="w-full" key={index}>
                            <Typography.Text className="font-normal">{label} :</Typography.Text>
                            <Typography.Text className="font-normal capitalize">
                                {label === 'Amount' ? `₹ ${value}` : value}
                            </Typography.Text>
                        </Flex>
                    ))}
                    {/* <Button
                        size="small"
                        danger
                        className="h-10 mt-4"
                        onClick={() => handleDownload(status)}
                    >
                        Download Docs
                    </Button> */}
                </Flex>
            )}
            <Divider className="border border-solid" />
        </Content>
    );
};

export default TableMobile;
