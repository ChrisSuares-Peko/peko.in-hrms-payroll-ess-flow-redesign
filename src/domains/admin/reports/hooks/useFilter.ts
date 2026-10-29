import { useState } from 'react';

import { DatePickerProps, PaginationProps } from 'antd';
import { RangePickerTimeProps } from 'antd/es/time-picker';
import { TableProps } from 'antd/lib';
import { Dayjs } from 'dayjs';

import { useFilterCommon } from '../types';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate?: string;
    initalEndDate?: string;
}

const useFilter = ({ setFilters, initalEndDate, initalStartDate }: Props) => {
    const [searchText, setSearchText] = useState<string>('');
    const handleSearch = (e: any) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            page,
        }));
    };
    const handlePartnerChange = (e?: string) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            partnerId: e,
            page: 1,
        }));
    };
    const handleChangeFilters = (e: any) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            id: e,
            page: 1,
        }));
        setSearchText('');
    };
    const handleCategoryFilters = (e: any) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            status: e,
            page: 1,
        }));
        setSearchText('');
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

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort;
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                ({ field } = sorter[0]);
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else if (sorter.order) {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                sortField: '',
                sort: '',
                page: 1,
            }));
            setSearchText('');
        }

        if (field) {
            handleSort(field.toString(), sort);
        }
    };

    const handleSort = (sortField: string, sort?: string) => {
        const formattedSortField = sortField.includes(',')
            ? sortField.split(',').join('.')
            : sortField;

        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            sortField: formattedSortField,
            sort,
            page: 1,
        }));
        setSearchText('');
    };

    return {
        handleSearch,
        handlePageChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleFromChange,
        handleDateChange,
        handleToChange,
        handleCategoryFilters,
        handleSort,
        handleTableChange,
        handlePartnerChange,
    };
};

export default useFilter;
