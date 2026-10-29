import { useState } from 'react';

import { Col, Row, Spin } from 'antd';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

// import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import MobileBookingCard from './MobileBookingCard';
import WebBookingCard from './WebBookingCard';
import useDownloadTicket from '../../hooks/useDownloadTicket';
import useUpdateBooking from '../../hooks/useUpdateBooking';
import { BookingList } from '../../types/manageBookings';
// import getModificationRequestedColumns from '../../utils/columns/getModificationRequestedColumns';

interface BookingBodyProps {
    bookings: BookingList[];
    currentPage: number;
    getBookingsListHandler: (num: number) => void;
    setReload: React.Dispatch<React.SetStateAction<boolean>>;
    availability: string;
}

function BookingsBody({
    bookings,
    currentPage,
    getBookingsListHandler,
    setReload,
    availability,
}: BookingBodyProps) {
    const { HandleDownloadTicket } = useDownloadTicket();
    const { md } = useScreenSize();
    const navigate = useNavigate();
    const { HandleUpdateBooking, isLoading } = useUpdateBooking();
    const [downloadTicketLoading, setDownloadedTicketLoading] = useState(false);
    const dispatch = useAppDispatch();

    const downloadTicket = async (id: number) => {
        try {
            setDownloadedTicketLoading(true);
            const res = await HandleDownloadTicket(id);
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

    const handleRetry = async (id: number) => {
        const res = await HandleUpdateBooking(id);
        // dispatch(showToast({ description: 'Booking request sent', variant: 'success' }));
        if (res) {
            getBookingsListHandler(currentPage);
        }
    };

    const handleModifyCancel = (id: number) => {
        navigate(
            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}`,
            {
                state: {
                    id,
                },
            }
        );
    };

    return (
        <Spin className="w-full" spinning={downloadTicketLoading}>
            <Row gutter={16}>
                {bookings && (
                    <>
                        {bookings.map((item, index) => {
                            const bookingKey = item.id ?? item.orderId ?? index;
                            return md ? (
                                <WebBookingCard
                                    key={bookingKey}
                                    booking={item}
                                    onDownloadTicket={() => downloadTicket(Number(item.orderId))}
                                    onModifyCancel={() => handleModifyCancel(item.orderId)}
                                    onRetry={() => handleRetry(Number(item.id))}
                                    isLoading={isLoading}
                                />
                            ) : (
                                <Col key={bookingKey} span={24}>
                                    <MobileBookingCard
                                        booking={item}
                                        onDownloadTicket={() =>
                                            downloadTicket(Number(item.orderId))
                                        }
                                        onModifyCancel={() => handleModifyCancel(item.orderId)}
                                        onRetry={() => handleRetry(Number(item.id))}
                                        isLoading={isLoading}
                                    />
                                </Col>
                            );
                        })}
                    </>
                )}
            </Row>
        </Spin>
    );
}

export default BookingsBody;
