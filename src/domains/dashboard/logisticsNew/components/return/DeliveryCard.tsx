import React from 'react';

import { Button, Card, Col, Flex, Image, Row, Tag, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import usePayment from '../../hooks/usePayment';
import { setSelectedDeliveryCompany } from '../../slice/logisticsSlice';
import { DeliveryCompanyOption } from '../../types';

const { Text } = Typography;

const DeliveryCard: React.FC<{ company: DeliveryCompanyOption }> = ({ company }) => {
    const dispatch = useAppDispatch();
    const { isLoading, handleLogisticsSubmission } = usePayment();

    const handleBookNow = () => {
        dispatch(setSelectedDeliveryCompany(company));
        handleLogisticsSubmission(undefined, company);
    };
    return (
        <Card className="mb-4 rounded-2xl shadow-sm" styles={{ body: { padding: 0 } }}>
            <Row align="middle" gutter={[16, 16]} wrap className="px-6 py-4">
                <Col xs={8} lg={4}>
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#FAF7FF] md:h-32 md:w-32">
                        {company.logo ? (
                            <Image
                                src={company.logo}
                                alt={`${company.courierName} logo`}
                                preview={false}
                                className="max-h-12 max-w-full object-contain md:max-h-16"
                            />
                        ) : (
                            <Text className="text-sm font-semibold text-gray-500 text-center px-1">
                                {company.courierName}
                            </Text>
                        )}
                    </div>
                </Col>

                <Col xs={16} lg={6}>
                    <Text className="text-base font-semibold md:text-lg">
                        {company.courierName}
                    </Text>
                </Col>

                <Col xs={12} lg={7}>
                    <Flex vertical className="items-center gap-1">
                        {/* deliveryType hidden — only accepting prepaid */}
                        {/* {company?.deliveryType && (
                            <Text type="secondary" className="text-xs text-center">
                                {company.deliveryType}
                            </Text>
                        )} */}

                        <Tag className="mt-1 w-fit rounded-full border-none bg-red-50 px-3 text-xs text-red-500">
                            {company?.serviceType}
                            {(() => {
                                if (company?.serviceType && company?.avgDeliveryTime) return ` - Est. delivery by ${company.avgDeliveryTime}`;
                                if (!company?.serviceType && company?.avgDeliveryTime) return `Est. delivery by ${company.avgDeliveryTime}`;
                                return '';
                            })()}
                        </Tag>
                    </Flex>
                </Col>

                <Col xs={12} lg={7}>
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
                            loading={isLoading}
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
