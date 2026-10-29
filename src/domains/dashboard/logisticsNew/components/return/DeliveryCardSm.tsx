import React from 'react';

import { Card, Button, Image, Typography, Flex, Divider } from 'antd';
import { useDispatch } from 'react-redux';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import usePayment from '../../hooks/usePayment';
import { setSelectedDeliveryCompany } from '../../slice/logisticsSlice';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;

const DeliveryCardMobile: React.FC<{ company: DeliveryCompanyOption }> = ({ company }) => {
    const dispatch = useDispatch();
    const { isLoading, handleLogisticsSubmission } = usePayment();

    const handleBookNow = () => {
        dispatch(setSelectedDeliveryCompany(company));
        handleLogisticsSubmission(undefined, company);
    };

    return (
        <Card
            className="rounded-2xl shadow-sm mb-4 w-full block sm:hidden"
            styles={{ body: { padding: 0 } }}
        >
            <Flex vertical align="center" gap={12}>
                {/* Logo */}
                <div className="rounded-t-2xl flex h-20 w-full bg-[#FAF7FF] items-center justify-center">
                    {company.logo ? (
                        <Image
                            src={company.logo}
                            preview={false}
                            alt={company.courierName}
                            className="max-h-10 object-contain"
                        />
                    ) : (
                        <Text className="text-sm font-semibold text-gray-500 text-center px-2">
                            {company.courierName}
                        </Text>
                    )}
                </div>

                {/* Company Name */}
                <Text className="text-lg px-2 font-semibold text-center">
                    {company.courierName}
                </Text>

                {/* deliveryType hidden — only accepting prepaid */}
                {/* {company.deliveryType && (
                    <Text className="text-xs px-2 text-gray-500 text-center">
                        {company.deliveryType}
                    </Text>
                )} */}

                {/* serviceType + avgDeliveryTime tag */}
                <div className="bg-red-50 text-red-500 px-4 py-1 rounded-full text-[0.58rem] font-medium">
                    {company.serviceType}
                    {company.avgDeliveryTime ? ` - Est. delivery by ${company.avgDeliveryTime}` : ''}
                </div>

                {/* Price */}
                <Flex justify="center" align="center" gap={2}>
                    <Text className="text-2xl font-semibold md:text-lg">
                        ₹{formatNumberWithLocalString(company.price)}
                    </Text>
                </Flex>

                <Divider className="my-0" />

                {/* Button */}
                <Flex className="w-full px-4 pb-2">
                    <Button
                        danger
                        type="primary"
                        className="w-full rounded-lg text-sm"
                        onClick={handleBookNow}
                        loading={isLoading}
                    >
                        Book Now
                    </Button>
                </Flex>
            </Flex>
        </Card>
    );
};

export default DeliveryCardMobile;
