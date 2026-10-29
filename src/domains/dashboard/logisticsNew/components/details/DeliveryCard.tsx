import React from 'react';

import { Card, Col, Divider, Flex, Image, Row, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';
import { RootState } from '@store/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import LeftArrow from '../../assets/arrow-left.svg';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;

const DeliveryCard: React.FC<{ company: DeliveryCompanyOption }> = ({ company }) => {
    const navigate = useNavigate();

    const handleEditClick = () => {
        navigate('/logistics');
    };

    const shipmentDetails = useAppSelector(
        (state: RootState) => state.reducer.logisticsV3.shipmentDetails
    );
    const hasData = company?.serviceType || company?.avgDeliveryTime;

    return (
        <Card className="my-6 rounded-3xl shadow-sm" styles={{ body: { padding: 0 } }}>
            <Row className="px-6 py-7" align="top" gutter={[24, 16]}>
                <Col xs={24} sm={6} md={4} lg={4}>
                    <Flex
                        align="center"
                        justify="center"
                        vertical
                        className="h-32 md:min-w-24 lg:min-w-32 rounded-3xl bg-[#FAF7FF]"
                    >
                        {company.logo ? (
                            <Image
                                src={company.logo}
                                preview={false}
                                className="max-h-20 object-contain rounded-xl"
                            />
                        ) : (
                            <Text className="text-sm font-semibold text-gray-500 text-center px-2">
                                {company.courierName}
                            </Text>
                        )}
                    </Flex>
                </Col>
                <Col xs={24} sm={18} md={20} lg={20}>
                    <Flex
                        align="start"
                        className="w-full gap-3 bg--500 justify-normal lg:justify-between flex-col lg:flex-row"
                    >
                        <Flex vertical gap={4}>
                            <Flex justify="space-between">
                                <Text className="text-xs">Origin</Text>
                                <Text className="text-xs">Destination</Text>
                            </Flex>

                            <Flex justify="space-between" align="center" className="mt-2 gap-5">
                                <Text className="font-semibold text-base">
                                    {shipmentDetails?.originCity?.city || ''}
                                </Text>
                                <ReactSVG
                                    src={LeftArrow}
                                    beforeInjection={svg =>
                                        svg.setAttribute('style', 'width: 20px; height: 20px;')
                                    }
                                />
                                <Text className="font-semibold text-base">
                                    {shipmentDetails?.destinationCity?.city || ''}
                                </Text>
                            </Flex>
                        </Flex>
                        <Flex vertical gap={4}>
                            <Text className="text-xs ">Package Dimensions</Text>
                            <Text className="font-semibold lg:mt-2 text-base">
                                {formatNumberWithLocalString(shipmentDetails.length)} x{' '}
                                {formatNumberWithLocalString(shipmentDetails.width)} x{' '}
                                {formatNumberWithLocalString(shipmentDetails.height)} cm,{' '}
                                {formatNumberWithLocalString(shipmentDetails.weight)} Kg
                            </Text>
                        </Flex>
                        <Flex vertical justify="center" align="center" className="mt-4">
                            <Text
                                onClick={handleEditClick}
                                className="cursor-pointer text-sm font-medium text-brandColor hover:underline"
                            >
                                Edit
                            </Text>
                        </Flex>
                    </Flex>
                    <Divider className="my-4" />
                    <Flex justify="space-between" align="center">
                        <Flex justify="center" align="start" vertical gap={2}>
                            <Text className="text-lg font-bold ">{company.courierName}</Text>
                            {/* deliveryType hidden — only accepting prepaid */}
                            {/* {company.deliveryType && (
                                <Text className="text-xs">{company.deliveryType}</Text>
                            )} */}
                        </Flex>

                        {hasData && (
                            <Tag className="rounded-full border-none bg-red-50 px-3 text-xs text-red-500">
                                {company?.serviceType}
                                {company?.serviceType &&
                                    company?.avgDeliveryTime &&
                                    ` - Est. delivery by ${company.avgDeliveryTime}`}
                                {!company?.serviceType &&
                                    company?.avgDeliveryTime &&
                                    `Est. delivery by ${company.avgDeliveryTime}`}
                            </Tag>
                        )}
                        <Flex align="center" gap={6}>
                            <Text className="text-xl font-semibold text-nowrap">
                                ₹{formatNumberWithLocalString(company.price)}
                            </Text>
                        </Flex>
                    </Flex>
                </Col>
            </Row>
        </Card>
    );
};

export default DeliveryCard;
