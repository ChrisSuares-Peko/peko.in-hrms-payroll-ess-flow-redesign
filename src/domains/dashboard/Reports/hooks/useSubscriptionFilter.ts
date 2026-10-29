import { useState } from 'react';

import { DatePickerProps, PaginationProps } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker/generatePicker/interface';
import { TableProps } from 'antd/lib';
import { Dayjs } from 'dayjs';

import { filterState, useFilterCommon } from '../types/index';

interface Props {
    setFilter: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
}

const useSubscriptionFilter = ({ setFilter, initalStartDate, initalEndDate }: Props) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchTexts, setSearchTexts] = useState<string>('');
    const handleSearch = (searchText: string) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            searchText,
            page: 1,
        }));
    };
    const handleChangeFilters = (selectedOption: string) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            category: selectedOption,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilter((prevState: useFilterCommon) => ({
            ...prevState,
            page,
        }));
    };
    const handleFilter = (sort: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            filter: sort ? sort[0] : '',
            page: 1,
        }));
    };
    // const handleSort = (sort: string) => {
    //     setFilter((prevState: filterState) => ({
    //         ...prevState,
    //         sort,
    //     }));
    // };
    const handleDateChange: RangePickerProps<Dayjs>['onChange'] = (dates, dateStrings) => {
        if (dates === null) {
            setFilter((prevState: filterState) => ({
                ...prevState,
                from: initalStartDate,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: filterState) => ({
                ...prevState,
                from: dateStrings[0],
                to: dateStrings[1],
                page: 1,
            }));
        }
    };
    const handleFromChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilter((prevState: filterState) => ({
                ...prevState,
                from: initalStartDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: filterState) => ({
                ...prevState,
                from: dateString,
                page: 1,
            }));
        }
    };
    const handleToChange: DatePickerProps['onChange'] = (date, dateString) => {
        if (date === null) {
            setFilter((prevState: filterState) => ({
                ...prevState,
                to: initalEndDate,
                page: 1,
            }));
        } else {
            setFilter((prevState: filterState) => ({
                ...prevState,
                to: dateString,
                page: 1,
            }));
        }
    };

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filters, sorter) => {
        let sortField = '';
        let sortOrder = '';
        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                sortField = sorter[0].field as string;

                sortOrder = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else if (sorter.order) {
            sortField = sorter.field as string;
            sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        } else {
            setFilter((prevState: useFilterCommon) => ({
                ...prevState,
                sortField: '',
                sort: 'DESC',
                page: 1,
            }));
            setSearchTexts('');
        }

        if (sortField) {
            if (sortField === 'amount') {
                sortField = 'amountInINR';
            }
            if (sortField === 'date') {
                sortField = 'transactionDate';
            }
            if (sortField === 'transactionID') {
                sortField = 'corporateTxnId';
            }
            if (sortField === 'category') {
                sortField = 'transactionCategory';
            }
            if (sortField === 'paymentMode') {
                sortField = 'paymentMode';
            }
            // if (sortField === 'operator') {
            //     sortField = 'serviceOperator.serviceProvider';
            // }
            // if (sortField === 'cashback') {
            //     sortField = 'corporateCashback';
            // }
            handleSort(sortField, sortOrder);
        }

        // Apply the filters
        if (filters.status) handleFilter(filters.status);
        else handleFilter(filters.status);
    };

    const handleSort = (sortField: string, sort?: string) => {
        const formattedSortField = sortField.includes(',')
            ? sortField.split(',').join('.')
            : sortField;

        setFilter((prevState: useFilterCommon) => ({
            ...prevState,
            sortField: formattedSortField,
            sort,
            page: 1,
        }));
        setSearchTexts('');
    };
    return {
        handleSearch,
        handleChangeFilters,
        handlePageChange,
        handleFilter,
        handleSort,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    };
};

export default useSubscriptionFilter;
