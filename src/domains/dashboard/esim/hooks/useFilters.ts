/* eslint-disable prefer-destructuring */
import { useCallback, useState } from 'react';

import { DatePickerProps, PaginationProps } from 'antd';
import { TableProps } from 'antd/lib';
import { Dayjs } from 'dayjs';

import { useFilterCommon } from '../../Reports/types';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate?: string;
    initalEndDate?: string;
}

const useFilter = ({ setFilters, initalStartDate, initalEndDate }: Props) => {
    const [searchText, setSearchText] = useState<string>('');
    const handleSearch = (e: any) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = (page, itemsPerPage) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            page,
            itemsPerPage,
        }));
    };

    const handleChangeFilters = (e: any) => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            partnerId: e,
            page: 1,
        }));
        setSearchText('');
    };

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort;
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                field = sorter[0].field;
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else if (sorter.order) {
            field = sorter.field;
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

    const handleDateChange = useCallback(
        (dates: [Dayjs | null, Dayjs | null]) => {
            const [start, end] = dates;
            if (start && end) {
                setFilters((prevFilters: any) => ({
                    ...prevFilters,
                    startDate: start.format('YYYY-MM-DD'),
                    endDate: end.format('YYYY-MM-DD'),
                }));
            }
        },
        [setFilters]
    );

    const handleFromChange: DatePickerProps['onChange'] = (date, dateString) => {
      
        if (date === null) {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                startDate: initalStartDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                startDate: dateString,
                page: 1,
            }));
        }
    };
    const handleToChange: DatePickerProps['onChange'] = (date, dateString) => {
      

        if (date === null) {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                endDate: initalEndDate,
                page: 1,
            }));
        } else {
            setFilters((prevState: useFilterCommon) => ({
                ...prevState,
                endDate: dateString,
                page: 1,
            }));
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
        handleTableChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    };
};

export default useFilter;
