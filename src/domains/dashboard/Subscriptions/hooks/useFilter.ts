import { PaginationProps } from 'antd';
import { RangePickerTimeProps } from 'antd/es/time-picker';
import { DatePickerProps } from 'antd/lib';
import { Dayjs } from 'dayjs';

import { useFilterCommon } from '../../Reports/types';
import { filterState } from '../types/types';

interface Props {
    setFilter: (value: any) => void;
    initalStartDate?: string;
    initalEndDate?: string;
}

const useFilter = ({ setFilter, initalStartDate, initalEndDate }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            search: e.target.value,
            start: 1,
        }));
    };

    const handlePageChange: PaginationProps['onChange'] = (start, length) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            start,
            length,
        }));
    };
    const handleDateChange: RangePickerTimeProps<Dayjs>['onChange'] = (dates, dateStrings) => {
        if (dates === null) {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                from: initalStartDate,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                from: dateStrings[0],
                to: dateStrings[1],
                page: 1,
            }));
        }
    };
    const handleFromChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                from: initalStartDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                from: dateString,
                page: 1,
            }));
        }
    };
    const handleToChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                to: dateString,
                page: 1,
            }));
        }
    };
    return {
        handleSearch,
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    };
};

export default useFilter;
