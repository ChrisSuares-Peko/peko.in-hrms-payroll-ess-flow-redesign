import React, { lazy, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Col, Flex, List, Row, Skeleton, Space, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useDispatch } from 'react-redux';
import { ReactSVG } from 'react-svg';

import add from '@domains/dashboard/Invoice/assets/add.svg';
import email from '@domains/dashboard/Invoice/assets/mail.svg';
import { useAppSelector } from '@src/hooks/store';

import GuideLineDetails from '../components/Guideline/GuideLineDetails';
import Tracker from '../components/Tracker';
import TrackerDetailsCard from '../components/TrackerDetailsCard';
import useTrackDetails from '../hooks/useTrackDetails';
import { setTrackerData } from '../slices/InvoicesSlices';
import '../assets/style.css';

const SendEmailModal = lazy(() => import('../components/SendEmailModal'));

type TrackList = {
    field: string;
    value: string;
    clickHandler?: (item: any) => void;
    isCopyable?: boolean;
};
const { Text, Paragraph } = Typography;

const TrackInvoice = () => {
    const dispatch = useDispatch();
    const { invoiceId } = useAppSelector(store => store.reducer.invoices);
    const { trackerData, dataSource, Loading, generatePaymentLink, isLoadingPaymentLink } =
        useTrackDetails(invoiceId);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        dispatch(setTrackerData(trackerData));
    }, [trackerData, dispatch]);

    const navigateTo = useCallback((item: any) => {
        const path = item.value;
        window.open(path, '_blank', 'noopener,noreferrer');
    }, []);

    const comments = trackerData?.comments?.replace(/"/g, '');
    const date = trackerData?.createdAt && new Date(trackerData?.createdAt);
    // const year = date.getUTCFullYear();
    // const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    // const day = String(date.getUTCDate()).padStart(2, '0');
    const formattedDate = date?.toISOString().slice(0, 19).replace('T', ' ');

    const paymentmode = useMemo(
        () =>
            trackerData?.paymentMode
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
        [trackerData?.paymentMode]
    );

    const statusStyles: any = {
        PAID: {
            text: 'text-green-600',
            background: 'bg-green-100',
            border: 'border-green-200',
        },
        PENDING: {
            text: 'text-yellow-700',
            background: 'bg-yellow-100',
            border: 'border-yellow-300',
        },
        EXPIRED: {
            text: 'text-[#D97B7B]',
            background: 'bg-[#FFC2C2]',
            border: 'border-[#d87e7e]',
        },
    };

    const TrackList: TrackList[] = useMemo(
        () => [
            {
                field: 'Invoice Number',
                value: trackerData?.invoiceDetails?.invoiceNo,
            },
            {
                field: 'Date & Time',
                value: formattedDate,
            },
            {
                field: 'Customer Name',
                value: trackerData?.recipientDetails?.customerName,
            },
            ...(paymentmode === 'Payment Link' &&
            // trackerData?.paymentLink !== null &&
            trackerData?.status !== 'PAID'
                ? [
                      {
                          field: 'Payment Link',
                          value: trackerData?.paymentLink,
                          isCopyable: true,
                          clickHandler: navigateTo,
                      },
                  ]
                : []),
            {
                field: 'Amount',
                value: `₹ ${trackerData?.amount}`,
            },
            {
                field: 'Mode of Payment',
                value: paymentmode,
            },
            {
                field: 'Invoice Status',
                value: trackerData?.status,
            },
            {
                field: 'Expiry Date',
                value: trackerData?.invoiceDetails?.dueDate,
            },
            {
                field: 'Notes',
                value:
                    trackerData?.comments && JSON.parse(trackerData?.comments) ? comments : 'N/A',
            },
        ],
        [trackerData, paymentmode, formattedDate, comments, navigateTo]
    );

    return (
        <Content>
            {Loading ? (
                <Skeleton />
            ) : (
                <>
                    <Text className="text-xl font-medium">Invoice Details</Text>

                    <Row gutter={[30, 10]} className="mt-4">
                        <Col xs={24} xl={11}>
                            {trackerData && (
                                <TrackerDetailsCard data={trackerData} dataSource={dataSource} />
                            )}
                        </Col>
                        <Col xs={24} xl={13}>
                            <Flex vertical className="w-full px-3">
                                <Flex vertical className="mt-7">
                                    <Tracker data={trackerData} />
                                </Flex>
                                <List
                                    className="mt-5"
                                    dataSource={TrackList}
                                    renderItem={(item, index) => (
                                        <Row
                                            className={`py-4 px-6 ${index % 2 === 0 ? 'bg-listBg' : 'bg-white'} ${index === TrackList.length - 1 ? '' : 'border-none'}`}
                                            key={index}
                                        >
                                            <Col span={24} className="bg-green-">
                                                <Flex className="flex flex-col sm:flex-row">
                                                    <div className="w-full sm:w-1/2">
                                                        <Text className="text-gray-600">
                                                            {item.field}
                                                        </Text>
                                                    </div>

                                                    {item.field === 'Invoice Status' ? (
                                                        (() => {
                                                            const style =
                                                                statusStyles[
                                                                    item.value || 'Pending'
                                                                ];
                                                            return style ? (
                                                                <Space
                                                                    className={`px-4 justify-center items-center font-medium py-1 rounded-full ${style.background} border ${style.border}`}
                                                                >
                                                                    <Paragraph
                                                                        className={`text-xs font-normal leading-none ${style.text}`}
                                                                    >
                                                                        {item.value.charAt(0) +
                                                                            item.value
                                                                                .slice(1)
                                                                                .toLowerCase()}
                                                                    </Paragraph>
                                                                </Space>
                                                            ) : null;
                                                        })()
                                                    ) : (
                                                        <div className="w-full md:w-1/2">
                                                            {
                                                                // eslint-disable-next-line no-nested-ternary
                                                                item.isCopyable ? (
                                                                    !trackerData?.paymentLink ? (
                                                                        <Button
                                                                            type="text"
                                                                            className="h-5 p-0 cursor-pointer flex gap-3 items-center text-wrap hover:!bg-transparent"
                                                                            onClick={
                                                                                generatePaymentLink
                                                                            }
                                                                            loading={
                                                                                isLoadingPaymentLink
                                                                            }
                                                                        >
                                                                            <ReactSVG
                                                                                className="text-bgOrange2"
                                                                                src={add}
                                                                                beforeInjection={svg => {
                                                                                    svg.setAttribute(
                                                                                        'style',
                                                                                        'width: 12px; height: 12px;'
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <Typography.Text className="text-bgOrange2">
                                                                                Generate Payment
                                                                                Link
                                                                            </Typography.Text>
                                                                        </Button>
                                                                    ) : (
                                                                        <Typography.Text
                                                                            className={`text-gray-600 ${item.clickHandler && 'cursor-pointer'}`}
                                                                        >
                                                                            <Typography.Paragraph
                                                                                copyable
                                                                                ellipsis
                                                                                className="m-0 text-red-500 custom-copyable"
                                                                                onClick={() => {
                                                                                    if (
                                                                                        item.clickHandler
                                                                                    ) {
                                                                                        item.clickHandler(
                                                                                            item
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {item.value}
                                                                            </Typography.Paragraph>
                                                                        </Typography.Text>
                                                                    )
                                                                ) : (
                                                                    <Flex
                                                                        gap={20}
                                                                        align="center"
                                                                        className="justify-between md:justify-start"
                                                                    >
                                                                        <Typography.Text
                                                                            className={`text-gray-600 ${item.clickHandler && 'cursor-pointer'}`}
                                                                        >
                                                                            {item.value}
                                                                        </Typography.Text>
                                                                    </Flex>
                                                                )
                                                            }
                                                        </div>
                                                    )}
                                                </Flex>
                                            </Col>
                                        </Row>
                                    )}
                                />
                            </Flex>
                            <Flex
                                gap={12}
                                className="ml-9 mt-4 cursor-pointer"
                                onClick={() => setModalVisible(true)}
                            >
                                <Text className="font-medium mt-1">Share</Text>
                                <ReactSVG src={email} />
                            </Flex>
                        </Col>
                    </Row>

                    <GuideLineDetails invoiceId={invoiceId} trackerData={trackerData} />
                </>
            )}
            <SendEmailModal
                open={modalVisible}
                handleCancel={() => setModalVisible(false)}
                invoiceId={trackerData?.id}
                invoiceOnly
            />
        </Content>
    );
};

export default TrackInvoice;
