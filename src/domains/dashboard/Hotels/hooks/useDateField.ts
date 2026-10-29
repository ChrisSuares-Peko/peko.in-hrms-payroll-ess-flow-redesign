import { useState } from 'react';

export default function useDateFields() {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
    const [checkInDate, setCheckInDate] = useState<string>('');
    const [checkOutDate, setCheckOutDate] = useState<string>('');
    const [isSelectingCheckIn, setIsSelectingCheckIn] = useState<boolean>(true);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const showCheckInCalendar = () => {
        setCalendarOpen(true);
        setIsSelectingCheckIn(true);
    };

    const showCheckOutCalendar = () => {
        setCalendarOpen(true);
        setIsSelectingCheckIn(false);
    };
    const handleCheckInSelect = (date: string) => {
        setCheckInDate(date);
        setCalendarOpen(false);
    };

    const handleCheckOutSelect = (date: string) => {
        setCheckOutDate(date);
        setCalendarOpen(false);
    };

    return {
        showModal,
        setCalendarOpen,
        handleCancel,
        showCheckInCalendar,
        showCheckOutCalendar,
        handleCheckInSelect,
        handleCheckOutSelect,
        isModalOpen,
        calendarOpen,
        checkInDate,
        isSelectingCheckIn,
        checkOutDate,
    };
}
