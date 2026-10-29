import type { FC } from 'react';

import { Card, Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

interface DeliveryAddressProps {}

const DeliveryAddress: FC<DeliveryAddressProps> = () => {
    const { Title, Text } = Typography;

    const orderDetails = useAppSelector(state => state.reducer.orderDetails.orderDetails);
    const addressDetails = orderDetails?.orderResponse.address;

    return (
        addressDetails && (
            <Flex vertical gap="middle" className="pt-0 md:pt-7">
                <Title level={5}>Your Delivery Address</Title>
                <Card className="rounded-xl">
                    <Flex vertical className="gap-2 md:gap-1">
                        <Flex gap="middle" align="flex-start" className="mb-2">
                            <Text className="text-xs md:text-base">
                                {addressDetails.firstName} {addressDetails.lastName || ''}{' '}
                            </Text>
                        </Flex>
                        <Flex gap="middle" align="flex-start">
                            <Text className="w-[100px] md:w-[120px] text-xs md:text-base shrink-0">
                                Address:
                            </Text>
                            <Text className="text-xs md:text-base">
                                {addressDetails.address || 'NA'}
                            </Text>
                        </Flex>
                        <Flex gap="middle" align="flex-start">
                            <Text className="w-[100px] md:w-[120px] text-xs md:text-base shrink-0">
                                Mobile Number:
                            </Text>
                            <Text className="text-xs md:text-base">
                                {addressDetails.phoneNumber || 'NA'}
                            </Text>
                        </Flex>
                        <Flex gap="middle" align="flex-start">
                            <Text className="w-[100px] md:w-[120px] text-xs md:text-base shrink-0">
                                Remarks:
                            </Text>
                            <Text className="text-xs md:text-base">
                                {addressDetails.remarks || 'NA'}
                            </Text>
                        </Flex>
                    </Flex>
                </Card>
            </Flex>
        )
    );
};

export default DeliveryAddress;
