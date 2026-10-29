import { DatePickerProps, PaginationProps } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';

import { filterState } from '../types/index';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
}

const useFilter = ({ setFilters, initalStartDate, initalEndDate }: Props) => {
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            page,
        }));
    };

    const handleDateChange = (dates: any, dateStrings: [string, string]) => {
        if (dates === null) {
            const today = new Date();
            const oneMonthAgoFormatted = dayjs(Number(today))
                .subtract(1, 'month')
                .format('YYYY-MM-DD');
            setFilters((prevState: filterState) => ({
                ...prevState,
                from: oneMonthAgoFormatted,
                to: today.toISOString().split('T')[0],
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

    // const handleSearch = (e: any) => {
    //     setFilters((prevState: filterState) => ({
    //         ...prevState,
    //         searchText: e.target.value,
    //         page: 1,
    //     }));
    // };

    const handleSearch = (searchText: string) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            searchText,
        }));
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

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort;
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                ({ field } = sorter[0]);
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        }

        if (field) {
            handleSort(field.toString(), sort);
        }
    };

    const handleSort = (sortField: string, sort?: string) => {
        const formattedSortField = sortField.includes(',')
            ? sortField.split(',').join('.')
            : sortField;

        setFilters((prevState: filterState) => ({
            ...prevState,
            sortField: formattedSortField,
            sort,
            page: 1,
        }));
    };

    return {
        handlePageChange,
        handleDateChange,
        handleSearch,
        handleFromChange,
        handleToChange,
        handleTableChange,
    };
};

export default useFilter;
