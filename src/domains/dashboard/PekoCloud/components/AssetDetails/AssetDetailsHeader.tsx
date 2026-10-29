/* eslint-disable no-nested-ternary */
import React from 'react';

import { Flex, Avatar, Typography, Tag, Space } from 'antd';

import cctvCat from '@domains/dashboard/PekoCloud/assets/icons/assets/cctv-category.svg';
import laptopCat from '@domains/dashboard/PekoCloud/assets/icons/assets/laptop-category.svg';
import memoryCat from '@domains/dashboard/PekoCloud/assets/icons/assets/memory-category.svg';
import printerCat from '@domains/dashboard/PekoCloud/assets/icons/assets/printer-category.svg';

type Props = {
    data: any;
    setRefState: (value: number) => void;
};
const AssetDetailsHeader = ({ data, setRefState }: Props) => {
    const getTagStyle = (assetType: string) => {
        switch (assetType) {
            case 'Rented':
                return {
                    backgroundColor: '#EF8C44',
                    color: '#FFFFFF',
                };
            case 'Owned':
                return {
                    backgroundColor: '#206E47',
                    color: '#FFFFFF',
                };
            case 'Leased':
                return {
                    backgroundColor: '#20366E',
                    color: '#FFFFFF',
                };
            default:
                return {
                    backgroundColor: '#D9D9D9',
                    color: '#FFFFFF',
                };
        }
    };
    const tagStyle = getTagStyle(data?.data?.assetType);
    return (
        <Flex className="py-6 " gap={5} justify="space-start" align="center">
            <Flex className="border-2 rounded-full p-2">
                <Avatar
                    src={
                        data?.data?.assetCategory === 'CCTV'
                            ? cctvCat
                            : data?.data?.assetCategory === 'Printer'
                              ? printerCat
                              : data?.data?.assetCategory === 'Memory Device'
                                ? memoryCat
                                : laptopCat
                    }
                    style={{ color: '#f56a00' }}
                    className="w-10 h-10 "
                />
            </Flex>
            <Flex className="py-2 ml-2" justify="space-between" align="start" vertical>
                <Flex className="py-2 ml-2" justify="space-between" align="start" vertical>
                    <Space size="middle">
                        <Typography.Text className="text-xl font-normal">
                            {data?.data?.assetName ?? 'N/A'}
                        </Typography.Text>

                        <Tag
                            style={{
                                borderRadius: '20px',
                                border: 0,
                                fontWeight: 'bold',
                                ...tagStyle,
                            }}
                        >
                            {data?.data?.assetType && data?.data?.assetType
                                ? // eslint-disable-next-line no-unsafe-optional-chaining
                                  data?.data?.assetType.charAt(0).toUpperCase() +
                                  // eslint-disable-next-line no-unsafe-optional-chaining
                                  data?.data?.assetType.slice(1)
                                : 'N/A'}
                        </Tag>
                    </Space>
                    <Typography.Text className="text-xs font-normal">
                        {' '}
                        {data?.data?.assetCategory ?? 'N/A'}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default AssetDetailsHeader;
