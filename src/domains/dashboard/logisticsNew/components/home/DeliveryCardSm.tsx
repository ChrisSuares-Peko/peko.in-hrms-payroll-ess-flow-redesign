import React from 'react';

import { Card, Button, Image, Typography, Flex, Divider, Tag } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setSelectedDeliveryCompany } from '../../slice/logisticsSlice';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;

const DeliveryCardMobile: React.FC<{ company: DeliveryCompanyOption }> = ({ company }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleBookNow = () => {
        dispatch(setSelectedDeliveryCompany(company));
        navigate(`/${paths.logistics.index}/${paths.logistics.details}`);
    };
    const hasData = company?.serviceType || company?.avgDeliveryTime;

    return (
        <Card
            className="rounded-2xl shadow-sm mb-4 w-full block sm:hidden"
            styles={{ body: { padding: 0 } }}
        >
            <Flex vertical className="px-1 pt-1" align="center" gap={12}>
                {/* Logo */}
                <div className="rounded-2xl flex h-20 w-full bg-[#FAF7FF]  items-center justify-center">
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
                <Text className="text-lg px-1 font-semibold text-center">
                    {company.courierName}
                </Text>

                {/* deliveryType hidden — only accepting prepaid */}
                {/* {company.deliveryType && (
                    <Text className="text-xs px-4 text-gray-500 text-center">
                        {company.deliveryType}
                    </Text>
                )} */}

                {hasData && (
                    <Tag className="mt-1 w-fit rounded-full border-none bg-red-50 px-3 text-xs text-red-500">
                        {company?.serviceType}
                        {company?.serviceType &&
                            company?.avgDeliveryTime &&
                            ` - Est. delivery by ${company.avgDeliveryTime}`}
                        {!company?.serviceType &&
                            company?.avgDeliveryTime &&
                            `Est. delivery by ${company.avgDeliveryTime}`}
                    </Tag>
                )}

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
                    >
                        Book Now
                    </Button>
                </Flex>
            </Flex>
        </Card>
    );
};

export default DeliveryCardMobile;
