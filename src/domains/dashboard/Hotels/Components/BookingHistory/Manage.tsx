/* eslint-disable no-plusplus */
import { useState } from 'react';

import { Button, Grid, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import CancelBooking from './CancelBooking';
import ManageSm from './ManageSm';
import ManageWeb from './ManageWeb';
import useBookingCancelApi from '../../hooks/useBookingCancelApi';
import DateFields from '../../hooks/useDateField';
import useTicketDownloadApi from '../../hooks/useDownloadTicketApi';
import { RoomDetails } from '../../types/hotelTypes';
import { OrderResponse } from '../../types/types';

const { Text } = Typography;

const { useBreakpoint } = Grid;
interface bookingProps {
    orderId: number;
    details: string;
    txnId: string;
    baseAmt: number;
    refetch?: any;
    txnDate: string;
    downloadTicketLoading: boolean;
    setDownloadedTicketLoading: any;
}

const Manage = ({
    orderId,
    details,
    txnId,
    baseAmt,
    refetch,
    txnDate,
    downloadTicketLoading,
    setDownloadedTicketLoading,
}: bookingProps) => {
    const dispatch = useAppDispatch();
    const { showModal, isModalOpen, handleCancel } = DateFields();

    // const orderResponseObj = JSON.parse(details);
    let orderResponseObj: OrderResponse = {
        hotelBookingDetails: {
            checkInDate: '',
            checkOutDate: '',
            CancelPolicies: [],
            TotalRooms: 0,
            LastCancellationDate: '',
            HotelName: '',
            HotelImage: '',
            IsRefundable: false,
        },
        PassengerTypes: [
            {
                passengers: [],
            },
        ],
        HotelBookingStatus: '',
        bookingStatus: '',
        BookingRefNo: '',
        bookingDetailsResponse: {
            HotelRoomsDetails: [],
        },
    };
    if (details) {
        try {
            orderResponseObj = JSON.parse(details);
        } catch (error) {
            console.error('Error parsing details:', error);
        }
    }
    const checkInDate = orderResponseObj?.hotelBookingDetails?.checkInDate;
    const checkOutDate = orderResponseObj?.hotelBookingDetails?.checkOutDate;

   const roomsData =
    orderResponseObj?.bookingDetailsResponse?.Rooms ||
    orderResponseObj?.bookingDetailsResponse?.HotelRoomsDetails ||
    [];

const passengers = roomsData.map((room:RoomDetails) => ({
    passengers:
        room?.HotelPassenger?.map((passenger) => ({
            PassengerType: passenger?.Age > 12 ? 'Adult' : 'Child',
            PassengerName: `${passenger?.FirstName ?? ''} ${passenger?.LastName ?? ''}`.trim(),
            Email: passenger?.Email,
            Phoneno: passenger?.Phoneno,
        })) || [],
}));


    const [charges, setCharges] = useState<any[]>(
        orderResponseObj?.hotelBookingDetails?.CancelPolicies
    );
    const { cancelStatusFetch } = useBookingCancelApi(refetch);

    const { download } = useTicketDownloadApi();
    // const { cancellation, isLoading } = useCancellationApi();
    let adultCount = 0;
    let childCount = 0;
    const rooms = orderResponseObj.hotelBookingDetails?.TotalRooms;
    passengers?.forEach((room: any) => {
        room.passengers?.forEach((passenger: any) => {
            if (passenger.PassengerType === 'Adult') {
                adultCount++;
            } else if (passenger.PassengerType === 'Child') {
                childCount++;
            }
        });
    });

    const checkInDate1 = new Date(checkInDate);
    const checkOutDate1 = new Date(checkOutDate);
    const timeDiff = checkOutDate1.getTime() - checkInDate1.getTime();
    const nightDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const nightDifferenceString =
        nightDifference > 1 ? `${nightDifference} Nights` : `${nightDifference} Night`;
    const Info = { checkInDate, checkOutDate };
    // const cId = orderResponseObj?.meta?.conversationId;
   

    const screens = useBreakpoint();

    const handleDownload = async () => {
        try {
            setDownloadedTicketLoading(true);
            const res = await download(Number(orderId));

            if (res) {
                           const fileData =
                               res?.pdfFile ??
                               res?.pdfBase64;
           
                           let uint8Array: Uint8Array | null = null;
                           if (typeof fileData === 'string') {
                               if (fileData.includes(',')) {
                                   const parts = fileData.split(',').map(part => Number(part.trim()));
                                   uint8Array = new Uint8Array(parts);
                               } else {
                                   const binaryString = atob(fileData);
                                   const bytes = new Uint8Array(binaryString.length);
                                   for (let i = 0; i < binaryString.length; i += 1) {
                                       bytes[i] = binaryString.charCodeAt(i);
                                   }
                                   uint8Array = bytes;
                               }
                           } else if (Array.isArray(fileData)) {
                               uint8Array = new Uint8Array(fileData);
                           } else if (fileData && typeof fileData === 'object') {
                               if (fileData.data && Array.isArray(fileData.data)) {
                                   uint8Array = new Uint8Array(fileData.data);
                               } else {
                                   const values = Object.keys(fileData)
                                       .sort((a, b) => Number(a) - Number(b))
                                       .map(key => Number(fileData[key]));
                                   uint8Array = new Uint8Array(values);
                               }
                           }
           
                           if (!uint8Array) {
                               throw new Error('Invalid ticket file data');
                           }
           
                           const arrayBuffer = uint8Array.buffer.slice(
                               uint8Array.byteOffset,
                               uint8Array.byteOffset + uint8Array.byteLength
                           ) as ArrayBuffer;
                           const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                           await saveAs(blob, res?.data?.pdfName || res?.pdfName || 'Ticket.pdf');

                setDownloadedTicketLoading(false);
            } else {
                setDownloadedTicketLoading(false);
            }
        } catch (error) {
            setDownloadedTicketLoading(false);
            dispatch(
                showToast({
                    description: 'Something went wrong while generating invoice',
                    variant: 'error',
                })
            );
        }
    };
    const cancellationStatus = orderResponseObj?.bookingStatus;
    const lastCancellationDate = orderResponseObj?.hotelBookingDetails?.LastCancellationDate
  dayjs.extend(customParseFormat);

const parsedLastCancellationDate = lastCancellationDate
    ? dayjs(lastCancellationDate, 'DD-MM-YYYY HH:mm:ss', true)
    : null;

const isBeforeDeadline = parsedLastCancellationDate
    ? parsedLastCancellationDate.isAfter(dayjs())
    : false;

const formattedDate = parsedLastCancellationDate?.isValid()
    ? parsedLastCancellationDate.format('DD-MM-YYYY')
    : '';

    const IsRefundable = orderResponseObj?.hotelBookingDetails?.IsRefundable;
    // adjustedDate.setFullYear(2025, 0, 17); // Set to January 17, 2025
    // adjustedDate.setHours(13, 57, 15); // Set to 13:57:15

    // Convert to ISO 8601 format with a 'Z' (UTC)
    // const formattedDate = adjustedDate.toISOString();
    // const date = new Date(formattedDate);
    // const year = date.getFullYear();
    // const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    // const day = String(date.getDate()).padStart(2, '0');
    // const formatedDate = `${year}-${month}-${day}`;

    let bookingButton;
    if (lastCancellationDate && !cancellationStatus) {
        bookingButton = (
            <Button
                danger
                type="default"
                size="middle"
                onClick={() => {
                    setCharges(orderResponseObj?.hotelBookingDetails.CancelPolicies);
                    showModal();
                }}
                className={`w-full  rounded-sm `}
                disabled={!isBeforeDeadline || !IsRefundable}
            >
                Cancel Booking
            </Button>
        );
    } else if (cancellationStatus === 'Pending' || cancellationStatus === 'InProgress') {
        // Assuming you have a handler for pending status
        bookingButton = <Text className="font-bold text-bgOrange2">Cancel Pending</Text>;
    } else if (cancellationStatus === 'Processed') {
        bookingButton = <Text className=" text-red-400">Booking Cancelled</Text>;
    } else {
        bookingButton = '';
    }
    return (
        <Content className="mt-5  border-2 border-solid border-gray-200 rounded-md">
            <Content className="px-5">
                <Row gutter={16} className="p-4 bg-white rounded-md">
                    {screens.md ? (
                        <ManageWeb
                            orderId={orderId}
                            orderResponseObj={orderResponseObj}
                            Info={Info}
                            nightDifferenceString={nightDifferenceString}
                            adultCount={adultCount}
                            childCount={childCount}
                            rooms={rooms}
                            cancellationDeadlineDate={formattedDate}
                            cancellationStatus={cancellationStatus}
                            handleDownload={handleDownload}
                            bookingButton={bookingButton}
                            handleRefetch={cancelStatusFetch}
                            txnId={txnId}
                            txnDate={txnDate}
                            IsRefundable={IsRefundable}
                            baseAmt={baseAmt}
                        />
                    ) : (
                        <ManageSm
                            orderId={orderId}
                            Info={Info}
                            adultCount={adultCount}
                            childCount={childCount}
                            rooms={rooms}
                            orderResponseObj={orderResponseObj}
                            cancellationDeadlineDate={formattedDate}
                            nightDifferenceString={nightDifferenceString}
                            cancellationStatus={cancellationStatus}
                            bookingButton={bookingButton}
                            handleDownload={handleDownload}
                            handleRefetch={cancelStatusFetch}
                            txnId={txnId}
                            txnDate={txnDate}
                            IsRefundable={IsRefundable}
                            baseAmt={baseAmt}
                        />
                    )}
                </Row>
                {isModalOpen && (
                    <CancelBooking
                        txnId={txnId}
                        isModalOpen={isModalOpen}
                        handleCancel={handleCancel}
                        orderId={orderId}
                        charges={charges}
                        baseAmt={baseAmt}
                        refetch={refetch}
                        isLoading={false}
                    />
                )}
            </Content>
        </Content>
    );
};

export default Manage;
