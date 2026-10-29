import React, { useState } from 'react';

import { Col, Flex, Typography, Divider, Form, Select, Tooltip } from 'antd';
import { Link } from 'react-router-dom';

import { formattedDateTime } from '@utils/dateFormat';

import { useTicketUpdate } from '../hooks/useTicketStatusUpdateApi';
import { singleTicketData } from '../types/type';
import { TicketStatusOnly } from '../utils/data';

type Props = {
    chatId: number | null;
    onTabChange: () => void;
    data?: singleTicketData;
};

const TicketInformation = ({ chatId, onTabChange, data }: Props) => {
    const { handleTicketStatusUpdate, isLoading } = useTicketUpdate(chatId);
    const [status, setStatus] = useState<string>(data?.status!);

    const handleUpdate = (p: string) => {
        handleTicketStatusUpdate(p).then(res => {
            if (res) setStatus(p);
        });
    };

    return (
        <Col
            xs={24}
            md={6}
            className="h-full p-2 rounded-md sm:rounded-2xl sm:m-2 sm:p-4 sm:bg-chatCardBg"
        >
            <Flex className="mt-4" justify="space-between">
                <Typography.Text className="sm:text-xl sm:font-medium ms-4">
                    Ticket Information
                </Typography.Text>
            </Flex>
            <Divider />
            <Flex vertical className="sm:mx-4 md:gap-5">
                <Flex vertical className="mt-2">
                    <Typography.Text className="text-titleText">Ticket Number</Typography.Text>
                    <Typography.Text className="my-2 text-black">{data?.id}</Typography.Text>
                </Flex>
                <Flex vertical className="my-2">
                    <Typography.Text className=" text-titleText">Date</Typography.Text>
                    <Typography.Text className="my-2 text-black">
                        {data?.createdAt ? formattedDateTime(new Date(data.createdAt)) : ''}
                    </Typography.Text>
                </Flex>
                <Flex vertical className="my-2">
                    <Typography.Text className=" text-titleText">Issue type</Typography.Text>
                    <Typography.Text className="my-2 text-black">
                        {data?.issueType ? data.issueType : 'N/A'}
                    </Typography.Text>
                </Flex>
                <Flex vertical className="my-2">
                    <Typography.Text className=" text-titleText">Module</Typography.Text>
                    <Typography.Text className="my-2 text-black">
                        {data?.module ? data.module : 'N/A'}
                    </Typography.Text>
                </Flex>
                <Flex vertical className="my-2">
                    <Typography.Text className=" text-titleText">Description</Typography.Text>
                    <Tooltip color="light-gray" title={data?.description || 'N/A'}>
                        <Typography.Text className="my-2 text-black" ellipsis>
                            {data?.description || 'N/A'}
                        </Typography.Text>
                    </Tooltip>
                </Flex>
                <Flex vertical className="my-2">
                    <Typography.Text className=" text-titleText">Image</Typography.Text>
                    <Typography.Text className="my-2 text-black">
                        {data?.screenshotImage ? (
                            <Link to={data.screenshotImage} target="_blank">
                                Link
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography.Text>
                </Flex>

                <Flex vertical>
                    <Form className="flex flex-col w-full gap-3" layout="vertical">
                        <Select
                            loading={isLoading}
                            disabled={isLoading || data?.status === 'REJECTED'}
                            value={status}
                            options={TicketStatusOnly}
                            onChange={p => handleUpdate(p)}
                            placeholder="Select Ticket Status"
                        />
                    </Form>
                </Flex>
            </Flex>
        </Col>
    );
};

export default TicketInformation;
