import { useEffect, useState } from 'react';

import { CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Tag, Tooltip, Typography } from 'antd';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import noItems from '../assets/icons/noItems.svg';
import styles from '../assets/styles.module.css';
import { CouponCode } from '../types/type';
import { serviceColors } from '../utils/pekoCredit';

export default function CouponCodeCard({ creditsData, isAnimate }: any) {
    const dispatch = useDispatch();
    const [visibleItems, setVisibleItems] = useState<number[]>([]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        return dispatch(
            showToast({
                description: 'Coupon code copied to clipboard',
                variant: 'success',
            })
        );
    };

    useEffect(() => {
        if (isAnimate) {
            creditsData.forEach((_: any, index: number) => {
                setTimeout(() => {
                    setVisibleItems((prev: number[]) => [...prev, index]);
                }, index * 300);
            });
        }
    }, [creditsData, isAnimate]);

    if (!creditsData.length) {
        return (
            <Flex vertical gap={20} className="w-full h-96" justify="center" align="center">
                <ReactSVG width={60} src={noItems} />
                <Typography.Text className="text-xl text-center ms-2 -mt-2 ">
                    No coupons available at the moment. Please check back later for exciting offers!
                </Typography.Text>
            </Flex>
        );
    }

    return (
        <Flex vertical className="w-full gap-5" align="center">
            {creditsData.map((item: CouponCode, index: number) => {
                if (!item) return null;
                const colorIndex = index % serviceColors.length;
                const { backgroundColor, borderColor } = serviceColors[colorIndex];

                return (
                    <Row
                        justify="start"
                        align="middle"
                        key={index}
                        className={`border w-full md:w-[80%] xl:w-[70%] p-5 rounded-2xl shadow-sm  hover:transform hover:scale-105 hover:shadow-lg transition-transform duration-300 ${isAnimate && styles.listItem} ${
                            visibleItems.includes(index) ? styles.popOut : ''
                        }`}
                        style={{
                            animationDelay: `${index * 0.3}s`,
                            border: `0.5px solid ${borderColor}`,
                            backgroundColor,
                            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                        }}
                    >
                        <Col xs={15} sm={10}>
                            <Flex vertical>
                                <Typography.Text className="text-lg font-medium line-clamp-1">
                                    {item.serviceName}
                                </Typography.Text>
                                <Flex className="w-1/2">
                                    {item.isClaimed && (
                                        <Tag
                                            className="border rounded-xl py-1"
                                            color="#33CC99"
                                            style={{
                                                fontSize: '0.7rem',
                                                lineHeight: '1.1',
                                            }}
                                        >
                                            Claimed
                                        </Tag>
                                    )}
                                </Flex>
                                {!item.isClaimed && (
                                    <Flex vertical>
                                        <Typography.Text className="text-xs text-textRed">
                                            Valid till{' '}
                                            {moment(item.validity).format('MMMM D, YYYY')}
                                            {(Number(item.minimumPurchase) > 0 ||
                                                Number(item.maximumDiscount) > 0) && (
                                                <Tooltip
                                                    overlayInnerStyle={{
                                                        color: '#171717',
                                                        width: '290px',
                                                    }}
                                                    color="white"
                                                    title={
                                                        <>
                                                            {item.minimumPurchase &&
                                                                Number(item.minimumPurchase) >
                                                                    0 && (
                                                                    <Flex>
                                                                        Minimum Purchase: ₹{' '}
                                                                        {formatNumberWithLocalString(
                                                                            item.minimumPurchase
                                                                        )}
                                                                    </Flex>
                                                                )}
                                                            {item.maximumDiscount &&
                                                                item.maximumDiscount > 0 && (
                                                                    <Flex>
                                                                        Maximum Discount: ₹{' '}
                                                                        {formatNumberWithLocalString(
                                                                            item.maximumDiscount
                                                                        )}
                                                                    </Flex>
                                                                )}
                                                        </>
                                                    }
                                                >
                                                    <InfoCircleOutlined className="ml-2 text-textGray" />
                                                </Tooltip>
                                            )}
                                        </Typography.Text>
                                        {item.couponType === 'SUBSCRIPTION' && item.billingType && (
                                            <Typography.Text className="text-xs text-textRed">
                                                Valid for{' '}
                                                {item.billingType === 'ANNUALLY'
                                                    ? 'yearly'
                                                    : 'monthly'}{' '}
                                                subscription
                                            </Typography.Text>
                                        )}
                                    </Flex>
                                )}
                            </Flex>
                        </Col>
                        <Col xs={9} sm={5} className="text-end sm:text-start">
                            <Typography.Text
                                style={{ margin: 0 }}
                                className="font-medium md:text-base text-sm"
                            >
                                {item.discountType === 'FLAT'
                                    ? `₹ ${formatNumberWithLocalString(item.discount)}`
                                    : `${item.discount}%`}
                            </Typography.Text>
                        </Col>
                        <Col xs={24} sm={9} className="mt-5 sm:mt-0">
                            <Flex align="center" gap={8} className="justify-end">
                                <Button
                                    danger
                                    type="dashed"
                                    disabled={item.isClaimed}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: item.isClaimed ? 'not-allowed' : 'pointer',
                                    }}
                                    onClick={() => handleCopyCode(item.couponCode)}
                                >
                                    <span style={{ lineHeight: '1', fontSize: '1rem' }}>
                                        {item.couponCode}
                                    </span>
                                    <Tooltip title="Copy Code">
                                        <CopyOutlined
                                            className={`text-${item.isClaimed ? 'textGrey' : 'textRed'}`}
                                            style={{
                                                fontSize: '.7rem',
                                                lineHeight: '1',
                                            }}
                                        />
                                    </Tooltip>
                                </Button>
                            </Flex>
                        </Col>
                    </Row>
                );
            })}
        </Flex>
    );
}
