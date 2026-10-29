import { DatePickerProps, PaginationProps } from 'antd';
import dayjs from 'dayjs';

import { filterState } from '../types/table';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
}

const useFilter = ({ setFilters, initalStartDate, initalEndDate }: Props) => {
    const handleChangeModule = (selectedOption: string) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            module: selectedOption,
            page: 1,
        }));
    };
    const handleChangeStatus = (selectedOption: string) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            status: selectedOption,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            page,
        }));
    };

    const handleDateChange = (dates: any, dateStrings: [string, string]) => {
        if (dates === null) {
            const today = dayjs();
            const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
            setFilters((prevState: filterState) => ({
                ...prevState,
                from: oneMonthAgoFormatted,
                to: today,
                page: 1,
            }));
        } else {
            setFilters((prevState: filterState) => ({
                ...prevState,
                from: dateStrings[0],
                to: dateStrings[1],
                page: 1,
            }));
        }
    };

    const handleFromChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilters((prevState: filterState) => ({
                ...prevState,
                from: initalStartDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: filterState) => ({
                ...prevState,
                from: dateString,
                page: 1,
            }));
        }
    };
    const handleToChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilters((prevState: filterState) => ({
                ...prevState,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: filterState) => ({
                ...prevState,
                to: dateString,
                page: 1,
            }));
        }
    };
    return {
        handleChangeModule,
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeStatus,
    };
};

export default useFilter;
