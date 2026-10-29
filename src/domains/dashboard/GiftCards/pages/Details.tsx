import React, { useEffect, useState } from 'react';

import { Col, Collapse, Flex, Image, Row, Skeleton, Typography } from 'antd';
import { useParams } from 'react-router-dom';

import '../styles/Style.css';
import defaultImage from '../assets/images/default.png';
import AboutTab from '../components/AboutTab';
import BuyForm from '../components/BuyForm';
import DeliveryTypeTag from '../components/DeliveryTypeTag';
// import GiftCard from '../components/GiftCard';
// import GiftCardSmall from '../components/GiftCardSmall';
import HowToUseTab from '../components/HowToUseTab';
import ReceiverDetailsCard from '../components/ReceiverDetailsCard';
import UsageTypeTag from '../components/UsageTypeTag';
import GetGiftDetails from '../hooks/useGiftDetailsApi';
import { GiftCardDetailResponse } from '../types/types';

// expiryAndValidity comes back as HTML (e.g. "<p><br>&emsp;12 Months</p><br>") — strip
// it down to plain text for the "Validity" line.
const stripHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || '').trim();
};

// Placeholder matching BuyForm's shell (title, 2x2 order-type buttons, amount
// box, continue button) so the layout doesn't jump once the API responds.
const BuyCardSkeleton = () => (
    <Flex
        vertical
        className="bg-white border border-[#f4f4f4] rounded-[2rem] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] p-5 md:p-8"
    >
        <Skeleton.Input active size="large" style={{ width: '60%' }} />
        <Row gutter={[14, 14]} className="mt-5">
            {[1, 2, 3, 4].map(key => (
                <Col span={12} key={key}>
                    <Skeleton.Button active block style={{ height: '3.55rem', width: '100%' }} />
                </Col>
            ))}
        </Row>
        <Skeleton.Input active block style={{ height: '3rem', marginTop: '1.25rem' }} />
        <Skeleton.Button active block style={{ height: '3rem', marginTop: '1rem' }} />
    </Flex>
);

// Placeholder matching ReceiverDetailsCard's collapsed row.
const ReceiverCardSkeleton = () => (
    <Flex
        justify="space-between"
        align="center"
        className="bg-white border border-[#f4f4f4] rounded-[2rem] shadow-[0px_2px_16px_1px_rgba(0,0,0,0.06)] px-6 py-5 mt-5"
    >
        <Skeleton.Input active size="small" style={{ width: '40%' }} />
        <Skeleton.Avatar active shape="circle" size={32} />
    </Flex>
);

const Details = () => {
    const { id } = useParams();
    // Receiver Details starts collapsed; Continue on the buy card opens it —
    // both cards stay independently expandable/collapsible after that.
    const [receiverCollapsed, setReceiverCollapsed] = useState(true);
    // Buy card's own visual collapsed state, lifted here purely for layout.
    const [buyCollapsed, setBuyCollapsed] = useState(false);
    // Separate from the above: whether the amount has actually been confirmed via
    // Continue. Expanding/re-collapsing the Buy card alone doesn't change this —
    // only editing the amount (see BuyForm) unconfirms it again.
    const [amountConfirmed, setAmountConfirmed] = useState(false);


    // Both cards' internal component state (Formik values, etc.) already resets
    // per product via their key={id}, but this state lives here in the parent,
    // which doesn't remount — reset it explicitly on navigating to a different
    // gift card.
    useEffect(() => {
        setBuyCollapsed(false);
        setReceiverCollapsed(true);
        setAmountConfirmed(false);
    }, [id]);

    let data: GiftCardDetailResponse | undefined;
    let isLoading;
    if (id) {
        ({ data, isLoading } = GetGiftDetails(id));
    }

      useEffect(() => {
        if (typeof Moengage?.track_event === 'function' && data) {
            Moengage.track_event('giftcard_brand_viewed', {
                brand_name: data?.mainGiftCard.brand_name || data?.mainGiftCard.name,
                min_amount: parseFloat(data?.mainGiftCard.min_price),
            });
        }
    }, [data]);

    const validityText = data?.mainGiftCard.expiryAndValidity
        ? stripHtml(data.mainGiftCard.expiryAndValidity)
        : undefined;

    const infoPanels = [
        {
            key: '1',
            label: 'Company Details',
            children: isLoading ? (
                <Skeleton active />
            ) : (
                <AboutTab
                    text={data?.mainGiftCard.description || 'No description available for this gift card'}
                />
            ),
        },
        {
            key: '2',
            label: 'Terms & Conditions',
            children: isLoading ? (
                <Skeleton active />
            ) : (
                <HowToUseTab
                    text={
                        data?.mainGiftCard.terms_and_condition || 'Terms and Conditions not available'
                    }
                />
            ),
        },
    ];

    return (
        <Row className="xs:mt-6 sm:mt-0">
            <Col xs={24}>
                {isLoading ? (
                    <Skeleton.Input active style={{ width: '16rem', marginBottom: '1rem' }} />
                ) : (
                    <Typography.Text className="mb-3 text-2xl font-medium">
                        {data?.mainGiftCard.product_name}
                    </Typography.Text>
                )}
                <Row gutter={[28, 20]} align="top" className="mt-6 max-w-[80rem]">
                    <Col xs={24} md={11} xl={10}>
                        <Flex
                            vertical
                            className="bg-white border border-[#cccccc80] rounded-[2rem] p-5 md:p-6 h-full"
                        >
                            {isLoading ? (
                                <Skeleton.Image
                                    active
                                    style={{
                                        borderRadius: '1.25rem',
                                        width: '100%',
                                        height: '13rem',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Image
                                    preview={false}
                                    src={data?.mainGiftCard.image}
                                    fallback={defaultImage}
                                    style={{
                                        borderRadius: '1.25rem',
                                        width: '100%',
                                        height: '13rem',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}
                            {!isLoading &&
                                (validityText ||
                                    data?.mainGiftCard.usageType ||
                                    data?.mainGiftCard.deliveryType) && (
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        wrap="wrap"
                                        gap={8}
                                        className="mt-3"
                                    >
                                        <Typography.Text className="text-sm font-medium whitespace-nowrap">
                                            {validityText ? `Validity ${validityText}` : ''}
                                        </Typography.Text>
                                        <Flex gap={8} align="center" wrap="wrap">
                                            {data?.mainGiftCard.usageType && (
                                                <UsageTypeTag usageType={data.mainGiftCard.usageType} />
                                            )}
                                            {data?.mainGiftCard.deliveryType && (
                                                <DeliveryTypeTag
                                                    deliveryType={data.mainGiftCard.deliveryType}
                                                    tatInDays={data.mainGiftCard.tatInDays}
                                                />
                                            )}
                                        </Flex>
                                    </Flex>
                                )}
                            <Collapse
                                className="mt-5 giftcard-info-collapse"
                                items={infoPanels}
                                defaultActiveKey={['1']}
                                expandIconPosition="end"
                                bordered={false}
                            />
                        </Flex>
                    </Col>
                    <Col xs={24} md={11} xl={12}>
                        {isLoading ? (
                            <>
                                <BuyCardSkeleton />
                                <ReceiverCardSkeleton />
                            </>
                        ) : (
                            <>
                                <BuyForm
                                    productData={data}
                                    key={id}
                                    collapsed={buyCollapsed}
                                    onToggle={setBuyCollapsed}
                                    onContinue={() => setReceiverCollapsed(false)}
                                    onAmountConfirmedChange={setAmountConfirmed}
                                />
                                <ReceiverDetailsCard
                                    key={id}
                                    id={data?.mainGiftCard.id}
                                    collapsed={receiverCollapsed}
                                    onToggle={setReceiverCollapsed}
                                    amountConfirmed={amountConfirmed}
                                />
                            </>
                        )}
                    </Col>
                </Row>
            </Col>

            {/* <Row className="mt-8 overflow-x-auto">
                {(data?.length ?? 0) > 0 && (
                    <>
                        <Typography.Title className="w-full" level={5}>
                            You may also like
                        </Typography.Title>
                        <Flex
                            // className="flex mt-5 space-x-8"
                            className={
                                screens.xs
                                    ? 'flex xs:mt-1 space-x-3'
                                    : 'flex mt-5  space-x-8 overflow-x-auto'
                            }
                            id="scrollbar"
                            style={{
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',

                                scrollbarWidth: 'thin', // For Firefox

                                scrollbarColor: 'rgba(0, 0, 0, 0.02) transparent',
                                // scrollbarColor: 'transparent transparent'
                            }}
                        >
                            {data?.relatedGiftCards.map((item, i) => (
                                <Col xs={12} sm={8} md={6} xl={4} key={i}>
                                    {screens.xs ? ( // Check if extra small screen
                                        <GiftCardSmall
                                            image={item.image}
                                            name={item.name}
                                            description={item.description}
                                            id={item.id}
                                        />
                                    ) : (
                                        <GiftCard
                                            image={item.image}
                                            name={item.name}
                                            description={item.description}
                                            id={item.id}
                                        />
                                    )}
                                </Col>
                            ))}
                        </Flex>
                    </>
                )}
            </Row> */}
        </Row>
    );
};

export default Details;
