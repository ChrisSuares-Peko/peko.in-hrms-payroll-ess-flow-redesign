import { DatePickerProps, PaginationProps } from 'antd';
import { RangePickerTimeProps } from 'antd/es/time-picker';
import { Dayjs } from 'dayjs';

import { useFilterCommon } from '../types';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate?: string;
    initalEndDate?: string;
}

const filter = ({ setFilters, initalEndDate, initalStartDate }: Props) => {
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            page,
        }));
    };
    const handleFromChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                from: initalStartDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                from: dateString,
                page: 1,
            }));
        }
    };
    const handleToChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                to: dateString,
                page: 1,
            }));
        }
    };
    const handleDateChange: RangePickerTimeProps<Dayjs>['onChange'] = (dates, dateStrings) => {
        if (dates === null) {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                from: initalStartDate,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                from: dateStrings[0],
                to: dateStrings[1],
                page: 1,
            }));
        }
    };
    return {
        handlePageChange,
        handleFromChange,
        handleToChange,
        handleDateChange,
    };
};

export default filter;
