import { useCallback, useEffect, useState } from 'react';

import { saveAs } from 'file-saver';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getAllBookingData, getFileBufferReportForBooking } from '../../api/hotels/hotelBookings';
import { getData } from '../../types';

const useHotelBookings = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();
    const getAllTableData = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getAllBookingData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.bookings);
            setCount(data.count);
        } else {
            setTableData([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, payload, role]);
    useEffect(() => {
        getAllTableData();
    }, [getAllTableData]);

    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferReportForBooking({
            userId: id,
            userType: role,
            type,
            ...payload,
        });
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            if (type === 'excel') {
                saveAs(blob, `Hotel_Booking_Report.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Hotel_Booking_Report.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Hotel_Booking_Report.pdf`);
            }
        }
        setIsLoading(false);
    };

    return {
        isLoading,

        tableData,
        count,
        downloadReport,
        getAllTableData,
    };
};

export default useHotelBookings;
