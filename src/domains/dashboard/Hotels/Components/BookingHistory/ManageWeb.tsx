import React from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Flex, Col, Button, Typography, Grid } from 'antd';
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import CheckInDetails from './CheckInDetails';
import HotelImageGallery from '../HotelImageGallery';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface ManageWebProps {
    orderResponseObj: {
        bookingDetailsResponse?: any;
        hotelBookingDetails: {
            checkInDate: string;
            checkOutDate: string;
            CancelPolicies: any[];
            TotalRooms: number;
            LastCancellationDate: string;
            HotelName: string;
            HotelImage: string;
            HotelImages?: string[];
        };
        PassengerTypes: {
            passengers: {
                PassengerType: string;
            }[];
        }[];
        HotelBookingStatus: string;
        BookingRefNo: string;
    };
    nightDifferenceString: string;
    adultCount: number;
    childCount: number;
    rooms: number;
    Info: {
        checkInDate?: string;
        checkOutDate?: string;
    };
    cancellationDeadlineDate?: string;
    cancellationStatus: string;
    bookingButton: React.ReactNode;
    handleDownload: () => void;
    handleRefetch: (orderId: number, txnId: any) => void;
    orderId: number;
    txnId: any;
    txnDate: string;
    IsRefundable: boolean;
    baseAmt: any;
}

const ManageWeb: React.FC<ManageWebProps> = ({
    orderResponseObj,
    nightDifferenceString,
    adultCount,
    childCount,
    rooms,
    Info,
    cancellationDeadlineDate,
    cancellationStatus,
    bookingButton,
    handleDownload,
    handleRefetch,
    orderId,
    txnId,
    txnDate,
    IsRefundable,
    baseAmt,
}) => {
    const screens = useBreakpoint();

    return (
        <>
            <Col className="gutter-row" span={24} xl={6}>
                <HotelImageGallery
                    images={
                        orderResponseObj?.hotelBookingDetails?.HotelImages?.length
                            ? orderResponseObj.hotelBookingDetails.HotelImages
                            : [orderResponseObj?.hotelBookingDetails?.HotelImage]
                    }
                />
            </Col>
            <Col className="gutter-row mt-5" span={24} xl={14}>
                <Flex justify="space-between" className="px-4">
                    <Flex vertical>
                        <Text className="font-medium text-base">
                            {orderResponseObj?.hotelBookingDetails?.HotelName}
                        </Text>
                    </Flex>
                    {/* <Flex vertical>
                        <Text className="font-medium text-base">
                        ₹ {formatNumberWithLocalString(baseAmt)}
                        </Text>
                    </Flex> */}
                    <Flex>
                        {orderResponseObj?.bookingDetailsResponse && (

                            <Text className="text-xs mt-0 font-medium whitespace-nowrap max-w-full">
                                {nightDifferenceString} | {adultCount}{' '}
                                {adultCount > 1 ? 'Adults' : 'Adult'} |{' '}
                                {childCount > 0 &&
                                    `${childCount} ${childCount > 1 ? 'Children' : 'Child'} |`}
                                {rooms} {rooms > 1 ? 'Rooms' : 'Room'} |{' '}
                                {IsRefundable ? 'Refundable' : 'Non-Refundable'}
                            </Text>

                        )}
                    </Flex>

                </Flex>

                <Flex justify="space-evenly" className="px-1">
                    <Flex vertical className="pt-3 items-center">
                        <Text
                            className="mt-1 text-gray-500 font-medium"
                            style={{ fontSize: '0.6875rem' }}
                        >
                            Check-in
                        </Text>
                        <Text
                            className="mt-1 font-medium"
                            style={{
                                fontSize: '0.89rem',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {Info?.checkInDate}
                        </Text>
                        {/* {Info?.checkInDate && (
                            <Text
                                className="mt-1 font-medium"
                                style={{
                                    fontSize: '0.6875rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {(Info?.checkInDate)}
                            </Text>
                        )} */}
                    </Flex>

                    <CheckInDetails nightDifferenceString={nightDifferenceString} />

                    <Flex
                        align="center"
                        vertical
                        className="pt-3"
                        style={{ marginRight: '-0.625rem' }}
                    >
                        <Text
                            className="mt-1 font-medium text-gray-500"
                            style={{ fontSize: '0.6875rem' }}
                        >
                            Check-out
                        </Text>
                        <Text
                            className="mt-1 font-medium"
                            style={{
                                fontSize: '0.89rem',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {Info?.checkOutDate}
                        </Text>
                        {/* {Info?.checkOutDate && (
                            <Text
                                className="mt-1 font-medium"
                                style={{
                                    fontSize: '0.6875rem',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {(Info?.checkOutDate)}
                            </Text>
                        )} */}
                    </Flex>
                </Flex>

                <Flex vertical className="p-3" align="center">
                    {orderResponseObj?.bookingDetailsResponse && (
                        <Flex>
                            <Text style={{ fontSize: '0.77rem' }}>Booking Number:</Text>
                            &nbsp;
                            <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                                {orderResponseObj?.bookingDetailsResponse?.ConfirmationNo}
                            </Text>
                        </Flex>
                    )}
                    {cancellationDeadlineDate && (
                        <Flex>
                            <Text style={{ fontSize: '0.77rem' }}>Cancellation Deadline Date:</Text>
                            &nbsp;
                            <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                                {dayjs(cancellationDeadlineDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                            </Text>
                        </Flex>
                    )}
                    <Flex>
                        <Text style={{ fontSize: '0.77rem' }}>Booking Date:</Text>
                        &nbsp;
                        <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                            {dayjs(txnDate).format('YYYY-MM-DD')}
                        </Text>
                    </Flex>
                    <Flex justify="center" align="center" className="mt-3 block xl:hidden">
                        <Text className="font-medium text-base text-center">
                            ₹ {formatNumberWithLocalString(baseAmt)}
                        </Text>
                    </Flex>
                </Flex>
            </Col>

            {orderResponseObj?.bookingDetailsResponse ? (
                <Col className="gutter-row justify-center flex" span={24} xl={4}>
                    <Flex justify="center" gap={10} className="w-full flex-row xl:flex-col">
                        <Flex className="w-full  " justify="center">
                            {/* {bookingStatus === 'CANCELLED' && ( */}
                            {/* <Typography.Text className="text-red-400 text-center">
                             Booking Cancelled
                         </Typography.Text> */}
                            {/* )} */}
                            {/* {bookingStatus === 'CONFIRMED' || bookingStatus === 'VOUCHERED' ? ( */}
                            {cancellationStatus !== 'Processed' && (
                                <Button
                                    size="middle"
                                    onClick={handleDownload}
                                    danger
                                    type="primary"
                                    className="font-medium px-5  w-full"
                                >
                                    Download
                                </Button>
                            )}

                            {/* ) : null} */}
                        </Flex>
                        <Flex className="w-full " justify="center" align="center">
                            {bookingButton}
                        </Flex>
                        {cancellationStatus && cancellationStatus !== 'Processed' && (
                            <Button
                                size="small"
                                onClick={() => handleRefetch(orderId, txnId)}
                                type="primary"
                            >
                                <ReloadOutlined />
                            </Button>
                        )}
                        {screens.xl && (
                            <Flex justify="center" align="center" className="mt-3">
                                <Text className="font-medium text-base">
                                    ₹ {formatNumberWithLocalString(baseAmt)}
                                </Text>
                            </Flex>
                        )}
                    </Flex>
                </Col>
            ) : (
                <Col className="gutter-row justify-center flex" span={24} xl={4}>
                    <Flex justify="center" gap={10} className="w-full flex-row xl:flex-col">
                        <Text className="font-bold sm:mt-5 xl:mt-9 ">Awaiting Booking Details</Text>
                    </Flex>
                </Col>
            )}
        </>
    );
};

export default ManageWeb;
