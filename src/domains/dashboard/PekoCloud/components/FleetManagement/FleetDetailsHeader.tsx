/* eslint-disable no-nested-ternary */
import React from 'react';

import { Flex, Avatar, Typography, Tag, Space } from 'antd';

import carCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/car-category.svg';
import suvCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/suv-category.svg';
import truckCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/truck-category.svg';
import twoWheelerCat from '@domains/dashboard/PekoCloud/assets/icons/fleet/twoWheeler-category.svg';

type Props = {
    vehicleDetails?: any;
    setRefState: (value: number) => void;
};
const FleetDetailsHeader = ({ vehicleDetails, setRefState }: Props) => {
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
    const tagStyle = getTagStyle(vehicleDetails?.data?.assetType);
    return (
        <Flex className="py-6 " gap={5} justify="space-start" align="start">
            <Flex>
                <Avatar
                    src={
                        vehicleDetails?.data?.vehicleType === 'Suv'
                            ? suvCat
                            : vehicleDetails?.data?.vehicleType === 'Truck'
                              ? truckCat
                              : vehicleDetails?.data?.vehicleType === 'Two Wheeler'
                                ? twoWheelerCat
                                : carCat
                    }
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #9E9E9E',
                        borderRadius: '50%',

                        objectFit: 'cover',
                    }}
                    className="w-16 h-16 p-2"
                />
            </Flex>
            <Flex className="py-2 ml-4" justify="space-between" align="start" vertical>
                <Flex className="py-2 -ml-2" justify="space-between" align="start" vertical>
                    <Space size="middle">
                        <Typography.Text className="text-xl font-normal">
                            {vehicleDetails?.data?.vehicleName}
                        </Typography.Text>

                        <Tag
                            style={{
                                borderRadius: '20px',
                                border: 0,
                                fontWeight: 'bold',
                                ...tagStyle,
                            }}
                        >
                            {vehicleDetails?.data?.assetType
                                ? // eslint-disable-next-line no-unsafe-optional-chaining
                                  vehicleDetails?.data?.assetType.charAt(0).toUpperCase() +
                                  // eslint-disable-next-line no-unsafe-optional-chaining
                                  vehicleDetails?.data?.assetType.slice(1)
                                : 'N/A'}
                        </Tag>
                    </Space>
                    <Typography.Text className="text-xs font-normal">
                        {vehicleDetails?.data?.vehicleType}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default FleetDetailsHeader;
