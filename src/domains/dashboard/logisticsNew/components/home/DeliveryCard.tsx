import React from 'react';

import { Button, Card, Col, Flex, Image, Row, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setSelectedDeliveryCompany } from '../../slice/logisticsSlice';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;

const DeliveryCard: React.FC<{ company: DeliveryCompanyOption }> = ({ company }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { shipmentDetails } = useAppSelector(state => state.reducer.logisticsV3);

    const handleBookNow = () => {
        dispatch(setSelectedDeliveryCompany(company));
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('logistics_book_now_clicked', {
                length: shipmentDetails?.length,
                breadth: shipmentDetails?.width,
                height: shipmentDetails?.height,
                weight: shipmentDetails?.weight,
                orgin_city: shipmentDetails?.originCity?.city,
                destination_city: shipmentDetails?.destinationCity?.city,
                price: company?.price,
                vendor_name: company?.courierName,
            });
        }

        navigate(`/${paths.logistics.index}/${paths.logistics.details}`);
    };
    const hasData = company?.serviceType || company?.avgDeliveryTime;

    return (
        <Card className="mb-4 rounded-2xl shadow-sm" styles={{ body: { padding: 0 } }}>
            <Row align="middle" gutter={[16, 16]} wrap className="ps-1 pr-6 py-1">
                <Col sm={8} md={4}>
                    <div className="flex h-full w-24 items-center justify-center rounded-2xl bg-[#FAF7FF] md:h-32 md:w-32">
                        {company.logo ? (
                            <Image
                                src={company.logo}
                                alt={`${company.courierName} logo`}
                                preview={false}
                                className="max-h-12 max-w-full object-contain md:max-h-20 rounded-xl"
                            />
                        ) : (
                            <Text className="text-sm font-semibold text-gray-500 text-center px-1">
                                {company.courierName}
                            </Text>
                        )}
                    </div>
                </Col>

                <Col xs={16} md={6}>
                    <Text className="text-base font-semibold md:text-lg ml-5">
                        {company.courierName}
                    </Text>
                </Col>

                <Col xs={12} md={6}>
                    <Flex vertical className="items-center gap-1">
                        {/* deliveryType hidden — only accepting prepaid */}
                        {/* {company?.deliveryType && (
                            <Text type="secondary" className="text-xs text-center">
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
                    </Flex>
                </Col>

                <Col xs={12} md={8}>
                    <div className="flex w-full items-center align-middle gap-4 justify-end">
                        <Flex justify="center" align="center" gap={2}>
                            <Text className="text-base font-semibold md:text-lg">
                                ₹{formatNumberWithLocalString(company.price)}
                            </Text>
                        </Flex>
                        <Button
                            type="primary"
                            danger
                            className="px-4 py-0 text-xs md:px-6 md:text-sm"
                            onClick={handleBookNow}
                        >
                            Book Now
                        </Button>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default DeliveryCard;
