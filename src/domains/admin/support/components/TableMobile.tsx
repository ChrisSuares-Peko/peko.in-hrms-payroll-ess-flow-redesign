import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';

import { ticketListingTableData } from '../types/type';

interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full ">
        <Typography.Text style={{ fontWeight: 400 }}>{label} :</Typography.Text>
        <Typography.Text className="font-normal">{value}</Typography.Text>
    </Flex>
);

interface TableProp {
    ticket: ticketListingTableData;
}
const dateFormat = 'DD-MM-YYYY';
const TableMobile: React.FC<TableProp> = ({ ticket }) => {
    const { date, issueDetails, module, id } = ticket;

    const formattedDate = dayjs(date).format(dateFormat);
    const [showMore, setshowMore] = useState<boolean>(false);
    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const details = [
        { label: 'Date', value: formattedDate },
        { label: 'Ticket ID', value: id },
        { label: 'Module', value: module },
        { label: 'Issue Details', value: issueDetails },
    ];
    return (
        <Content className="p-5 rounded-md ">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={7}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray">
                                {id}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        {' '}
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{formattedDate}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={8}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray">
                                {module}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={2}>
                        <Flex justify="end">
                            <RightOutlined
                                onClick={handleSeeMore}
                                className={`collapse-icon ${showMore ? 'open' : ''}`}
                            />
                        </Flex>
                    </Col>
                </Row>
                {showMore && (
                    <Flex vertical gap={10} className="p-6 bg-bgLightGray">
                        {details.map((detail, index) => (
                            <DetailSection key={index} {...detail} />
                        ))}
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default TableMobile;
