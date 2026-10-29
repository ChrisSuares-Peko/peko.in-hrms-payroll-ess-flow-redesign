import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { toTitleCase } from '@utils/wordFormat';

import { setAddressData, setFormData, setProductData } from '../slices/checkoutSlice';
import { GiftCardOrderTypes } from '../types/employee';
import { OrderHistoryTableData } from '../types/types';

interface DetailProps {
    label: string;
    value: string | number;
}

const DetailSection: React.FC<DetailProps> = ({ label, value }) => (
    <Flex justify="space-between" className="w-full">
        <Typography.Text style={{ fontWeight: 400 }}>{label} :</Typography.Text>
        <Typography.Text className="font-normal">{value}</Typography.Text>
    </Flex>
);

const statusMap: Record<string, string> = {
    SUCCESS: 'Success',
    FAILURE: 'Failed',
    PENDING: 'In Progress',
    Success: 'Success',
    Failure: 'Failed',
    Pending: 'In Progress',
};

interface HistoryCardProps {
    item: OrderHistoryTableData;
}

const OrderHistorycardMobile: React.FC<HistoryCardProps> = ({ item }) => {
    const { txnId, date, paymentMode, status, giftCardName, amount, orderType, quantity } = item;
    const [showMore, setShowMore] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const displayStatus = statusMap[status] || status;
    const isSuccess = status === 'SUCCESS' || status === 'Success';

    const details = [
        { label: 'Date', value: formattedDateTime(new Date(date)) },
        { label: 'Order ID', value: txnId },
        { label: 'Order Type', value: orderType ?? '-' },
        { label: 'Quantity', value: quantity ?? '-' },
        { label: 'Payment Mode', value: toTitleCase(paymentMode) },
    ];

    const handleBuyAgain = () => {
        dispatch(setFormData(item.formData as any));
        dispatch(setProductData(item.productDetails as any));
        dispatch(setAddressData(item.addressDetails as any));
        navigate(
            `${paths.dashboard.giftCards}/${paths.giftcards.details}/${(item.productDetails as Record<string, unknown>)?.id}`
        );
    };

    return (
        <Content className="p-5 rounded-md">
            <Flex gap={20} vertical>
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={6}>
                        <Flex justify="start">
                            <Typography.Text className="text-xs">{giftCardName}</Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Typography.Text className="text-xs font-normal text-center text-textDarkGray text-nowrap">
                                ₹ {formatNumberWithLocalString(Number(amount))}
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col xs={7}>
                        <Flex justify="center">
                            <Button
                                danger
                                size="small"
                                style={{
                                    background: isSuccess
                                        ? 'var(--Success-50, #ECFDF3)'
                                        : 'rgba(242, 244, 247, 1)',
                                    color: isSuccess
                                        ? 'var(--Success-700, #027A48)'
                                        : 'rgba(52, 64, 84, 1)',
                                }}
                                className="px-2 border-0 rounded-xl"
                                disabled
                            >
                                <Typography.Text className="text-xs">{displayStatus}</Typography.Text>
                            </Button>
                        </Flex>
                    </Col>
                    <Col xs={4}>
                        <Flex justify="center">
                            <RightOutlined
                                onClick={() => setShowMore(prev => !prev)}
                                className={`collapse-icon ${showMore ? 'open' : ''}`}
                            />
                        </Flex>
                    </Col>
                </Row>
                {showMore && (
                    <Flex vertical gap={10} className="p-6 bg-bgLightGray">
                        {details.map((detail, index) => (
                            <DetailSection key={index} {...detail} />
                        ))}
                        {item.addressDetails && orderType !== 'Buy for Self' && (
                            <>
                                <Divider className="my-1" />
                                <Typography.Text className="font-medium text-sm">
                                    Recipient Details
                                </Typography.Text>
                                {(orderType === 'Buy for Employees' ||
                                    orderType === GiftCardOrderTypes.BUYFOREMPLOYEE) &&
                                item.addressDetails.employee?.length > 0 ? (
                                    item.addressDetails.employee.map((emp, idx) => (
                                        <Flex key={idx} vertical gap={4}>
                                            <DetailSection
                                                label="Recipient Name"
                                                value={emp.receiverFirstName || '-'}
                                            />
                                            <DetailSection
                                                label="Recipient Email"
                                                value={emp.receiverEmail || '-'}
                                            />
                                        </Flex>
                                    ))
                                ) : (
                                    <>
                                        <DetailSection
                                            label="Receiver Name"
                                            value={item.addressDetails.receiverFirstName || '-'}
                                        />
                                        <DetailSection
                                            label="Receiver Email"
                                            value={item.addressDetails.receiverEmail || '-'}
                                        />
                                    </>
                                )}
                            </>
                        )}
                        <Button
                            type="default"
                            className="mt-3 border-bgOrange text-bgOrange"
                            onClick={handleBuyAgain}
                        >
                            Buy Again
                        </Button>
                    </Flex>
                )}
                <Divider className="border border-solid" />
            </Flex>
        </Content>
    );
};

export default OrderHistorycardMobile;
