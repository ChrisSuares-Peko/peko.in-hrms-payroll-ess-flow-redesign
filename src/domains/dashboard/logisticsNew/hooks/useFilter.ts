import { PaginationProps } from 'antd';
import { DatePickerProps } from 'antd/lib';

import { removeEmoji } from '@utils/regex';

import { useFilterCommon } from '../../Reports/types';
import { filterState } from '../types/orderHistory';

interface Props {
    setFilter: (value: any) => void;
    initalStartDate?: string;
    initalEndDate?: string;
}

const useFilter = ({ setFilter, initalStartDate, initalEndDate }: Props) => {
    const handleSearch = (e: any) => {
        let filteredValue = e.target.value;
        filteredValue = filteredValue.replace(removeEmoji, '');
        setFilter((prevState: filterState) => ({
            ...prevState,
            searchText: filteredValue,
            page: 1,
        }));
    };

    const handlePageChange: PaginationProps['onChange'] = (page, itemsPerPage) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            page,
            itemsPerPage,
        }));
    };
    const handleDateChange = (dates: any, dateStrings: [string, string]) => {
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
