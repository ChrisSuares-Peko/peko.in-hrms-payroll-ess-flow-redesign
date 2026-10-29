import React from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Row, Button, Typography, Flex, Col } from 'antd';
// Import the CancelBooking component
import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';


const { Text } = Typography;

interface ManageSmProps {
    orderResponseObj: {
        bookingDetailsResponse?: any;
        hotelBookingDetails: {
            checkInDate: string;
            checkOutDate: string;
            CancelPolicies: any[];
            TotalRooms: number;
            LastCancellationDate: string;
            HotelName: string;
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
    handleRefetch: (Id: number, txnId: any) => void;
    orderId: number;
    txnId: any;
    txnDate: string;
    IsRefundable: boolean;
    baseAmt: any;
}

const ManageSm: React.FC<ManageSmProps> = ({
    Info,
    // res,
    adultCount,
    childCount,
    rooms,
    orderResponseObj,
    cancellationDeadlineDate,
    nightDifferenceString,
    cancellationStatus,
    bookingButton,
    handleDownload,
    handleRefetch,
    orderId,
    txnId,
    txnDate,
    IsRefundable,
    baseAmt,
}) => (
        <Row gutter={24}>
            <Row className="w-full">
                <Text
                    className=" text-gray-500 font-small line-clamp-1"
                    style={{ fontSize: '0.73rem' }}
                >
                    {/* {Info?.address} */}
                </Text>
                <Flex vertical align="baseline" className="w-full mt-1">
                    <Text className="text-xs text-gray-500">
                        {orderResponseObj?.bookingDetailsResponse?.AddressLine1}
                    </Text>
                    <Text className="font-medium mt-1" style={{ fontSize: '1.22rem' }}>
                        {orderResponseObj?.hotelBookingDetails?.HotelName}
                    </Text>

                    <div className="w-full text-right">
                        {orderResponseObj?.bookingDetailsResponse && (
                            <Text className="xs:text-[0.63rem] sm:text-xs mt-0 font-medium whitespace-nowrap max-w-full">
                                {nightDifferenceString} | {adultCount}{' '}
                                {adultCount > 1 ? 'Adults' : 'Adult'} |{' '}
                                {childCount > 0 &&
                                    `${childCount} ${childCount > 1 ? 'Children' : 'Child'} |`}
                                {rooms} {rooms > 1 ? 'Rooms' : 'Room'} |{' '}
                                {IsRefundable ? 'Refundable' : 'Non-Refundable'}
                            </Text>
                        )}
                    </div>
                </Flex>
            </Row>

            <Flex vertical gap={2} className="py-3 w-full">
                {orderResponseObj?.bookingDetailsResponse && (
                    <Flex justify="space-between" className="w-full">
                        <Text style={{ fontSize: '0.77rem' }}>Booking Number:</Text>
                        <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                            {orderResponseObj?.bookingDetailsResponse?.ConfirmationNo}
                        </Text>
                    </Flex>
                )}
                {cancellationDeadlineDate && (
                    <Flex justify="space-between" className="w-full">
                        <Text style={{ fontSize: '0.77rem' }}>Cancellation Deadline Date:</Text>
                        <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                            {dayjs(cancellationDeadlineDate, 'DD-MM-YYYY').format('YYYY-MM-DD')}
                        </Text>
                    </Flex>
                )}
                <Flex justify="space-between" className="w-full">
                    <Text style={{ fontSize: '0.77rem' }}>Booking Date:</Text>
                    &nbsp;&nbsp;
                    <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                        {dayjs(txnDate).format('YYYY-MM-DD')}
                    </Text>
                </Flex>
                {orderResponseObj?.bookingDetailsResponse && (
                    <Flex justify="space-between" className="w-full">
                        <Text style={{ fontSize: '0.77rem' }}>Amount:</Text>
                        &nbsp;&nbsp;
                        <Text className="font-medium" style={{ fontSize: '0.77rem' }}>
                            ₹ {formatNumberWithLocalString(baseAmt)}
                        </Text>
                    </Flex>
                )}
            </Flex>

            <Flex justify="space-between" className="w-full">
                {/* Check-in Details Column */}
                <Flex vertical>
                    <Text className="mt-3 text-gray-500 font-small" style={{ fontSize: '0.80rem' }}>
                        Check-in
                    </Text>
                    <Text className="mt-1 font-medium" style={{ fontSize: '0.93rem' }}>
                        {Info?.checkInDate}{' '}
                    </Text>
                    {/* {Info?.checkInTime && (
                        <Text className="mt-1 font-medium" style={{ fontSize: '0.90rem' }}>
                            {convertToAMPM(Info?.checkInTime)}
                        </Text>
                    )} */}
                </Flex>

                {/* No of Nights Column */}
                <Flex className="text-center">
                    <Text
                        className="mt-6 font-medium text-brandPrimary"
                        style={{ fontSize: '0.6rem' }}
                    >
                        <span className="hidden xs375:inline">-- {nightDifferenceString} --</span>
                        <span className="inline xs375:hidden">{nightDifferenceString}</span>
                    </Text>
                </Flex>

                {/* Check-out Details Column */}
                <Flex vertical>
                    <Text
                        className="mt-3 text-gray-500 font-small text-end"
                        style={{ fontSize: '0.80rem' }}
                    >
                        Check-out
                    </Text>
                    <Text className="mt-1 font-medium text-end" style={{ fontSize: '0.93rem' }}>
                        {Info?.checkOutDate}
                    </Text>
                    {/* {Info?.checkOutTime && (
                        <Text className="mt-1 font-medium text-end" style={{ fontSize: '0.90rem' }}>
                            {convertToAMPM(Info?.checkOutTime)}
                        </Text>
                    )} */}
                </Flex>
            </Flex>

            {/* ---------------------Action Buttons---------------------- */}

            {orderResponseObj?.bookingDetailsResponse ? (
                <Flex gap={10} className="w-full flex-col sm:flex-row mt-5">
                    <Flex className="w-full" justify="center">
                        {/* {bookingStatus === 'CANCELLED' && (
                        <Typography.Text className="text-red-400 text-center">
                            Booking Cancelled
                        </Typography.Text>
                    )} */}
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
                    <Flex justify="center" className="w-full">
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
                </Flex>
            ) : (
                <Col className="gutter-row justify-center flex" span={24} xl={4}>
                    <Flex justify="center" gap={10} className="w-full flex-row xl:flex-col">
                        <Text className="font-bold sm:mt-5 xl:mt-9 ">Awaiting Booking Details</Text>
                    </Flex>
                </Col>
            )}
        </Row>
    );

export default ManageSm;
