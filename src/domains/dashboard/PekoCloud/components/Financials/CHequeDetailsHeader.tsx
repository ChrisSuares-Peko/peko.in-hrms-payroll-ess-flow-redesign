import React from 'react';

import { Flex, Avatar, Typography, Space, Tag } from 'antd';

import chequeNumber from '@domains/dashboard/PekoCloud/assets/icons/cheque-number.svg';

type Props = {
    data?: any;
    setRefState?: (value: number) => void;
};
const ChequeDetailsHeader = ({ data, setRefState }: Props) => {
    const getTagStyle = (statusType: string) => {
        switch (statusType) {
            case 'Pending':
                return {
                    backgroundColor: '#FFF8B7',
                    color: '#BA9C00',
                };
            case 'Completed':
                return {
                    backgroundColor: '#206E47',
                    color: '#FFFFFF',
                };
            default:
                return {
                    backgroundColor: '#D9D9D9',
                    color: '#FFFFFF',
                };
        }
    };
    const tagStyle = getTagStyle(data?.data?.status);
    return (
        <Flex className="py-6 " gap={5} justify="space-start" align="center">
            <Flex className="p-2 border-2 rounded-full">
                <Avatar src={chequeNumber} style={{ color: '#f56a00' }} className="w-10 h-10 " />
            </Flex>
            <Flex className="py-2 ml-2" justify="space-between" align="start" vertical>
                <Flex className="py-2 ml-2" justify="space-between" align="start" vertical>
                    <Space size="middle">
                        <Typography.Text className="text-xl font-normal">
                            {data?.data?.chequeNumber ?? 'N/A'}
                        </Typography.Text>

                        <Tag
                            style={{
                                borderRadius: '20px',
                                border: 0,
                                fontWeight: 'bold',
                                ...tagStyle,
                            }}
                        >
                            {data?.data?.status && data?.data?.status
                                ? // eslint-disable-next-line no-unsafe-optional-chaining
                                  data?.data?.status.charAt(0).toUpperCase() +
                                  // eslint-disable-next-line no-unsafe-optional-chaining
                                  data?.data?.status.slice(1)
                                : 'N/A'}
                        </Tag>
                    </Space>
                    <Typography.Text className="text-xs font-normal">
                        {' '}
                        {data?.data?.bankAccount ?? 'N/A'}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
};
export default ChequeDetailsHeader;
