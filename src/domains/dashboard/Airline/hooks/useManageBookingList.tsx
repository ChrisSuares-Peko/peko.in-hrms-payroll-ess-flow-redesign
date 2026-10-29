import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBookingsList } from '../api';
import { BookingList, BookingListRes } from '../types/manageBookings';

export const useManageBookingListAPI = (
    currentPage: number,
    availability: string,
    reload: boolean
) => {
    const { role, id } = useAppSelector((state: { reducer: { auth: any } }) => state.reducer.auth);
    const [bookingData, setBookingData] = useState<BookingList[]>();
    const [pageData, setPageData] = useState({
        page: 0,
        limit: 0,
        count: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    const getBookingsListHandler = useCallback(
        async (page: number) => {
            setIsLoading(true);
            const data: BookingListRes | false = await getBookingsList({
                userId: id,
                userType: role,
                page,
                availability,
            });
            if (data) {
                setPageData({
                    page: data.page,
                    limit: data.limit,
                    count: data.count,
                });
                const arr = data?.bookings;
                const res: BookingList[] = [];
                arr.forEach(async item => {
                    const firstSegment = item.journey[0];
                    const lastSegment = item.journey[item.journey.length - 1];

                    const bookingDat = {
                        id: item.id,
                        corporateTxnId: item.transaction.corporateTxnId,
                        TraceId: item.TraceId,
                        logo: `https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${firstSegment.Airline.AirlineCode}.gif?alt=media`,
                        flightName: firstSegment.Airline.AirlineName,
                        bookingId: item.BookingId,
                        pnr: item.PNR,
                        inbountPnr: item.inbountPNR,
                        inbountBookingId: item.inbountBookingId,
                        flightClass: firstSegment.CabinClass,
                        flightDuration: firstSegment?.Duration,
                        stopCount: item.journey.length - 1,
                        status: item?.bookingStatus,
                        orderId: item?.orderId,
                        depart: {
                            datetime: firstSegment?.Origin.DepTime,
                            terminal: firstSegment?.Origin.Airport.Terminal,
                            airport: firstSegment?.Origin.Airport.AirportCode,
                        },
                        arrive: {
                            datetime: lastSegment?.Destination.ArrTime,
                            terminal: lastSegment?.Destination.Airport.Terminal,
                            airport: lastSegment?.Destination.Airport.AirportCode,
                        },
                        journey: item.journey,
                        inbountJourney: item.inbountJourney,
                        transaction: item?.transaction,
                        bookingCurrentStatus: item?.bookingStatus,
                        bookingDate: item?.createdAt,
                    };
                    res.push(bookingDat);
                });

                setBookingData(res);
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        },
        [availability, id, role]
    );

    useEffect(() => {
        getBookingsListHandler(currentPage);
    }, [currentPage, getBookingsListHandler, reload]);

    return { data: bookingData, pageData, isLoading, getBookingsListHandler };
};
