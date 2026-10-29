import { PaginationProps, TableProps } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker/generatePicker/interface';
import { DatePickerProps } from 'antd/lib';
import dayjs, { Dayjs } from 'dayjs';

import { filterState } from '../types/index';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
}

const useFilter = ({ setFilters, initalStartDate, initalEndDate }: Props) => {
    const handleChangeCorporate = (selectedOption: string) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            corporateId: selectedOption,
            page: 1,
        }));
    };
    const handleSearch = (e: any) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            page,
        }));
    };

    const handleDateChange: RangePickerProps<Dayjs>['onChange'] = (dates, dateStrings) => {
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
    const handleChangeFilters = (e: any) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            id: e,
            page: 1,
        }));
    };
    const handleCategoryFilters = (e: any) => {
        setFilters((prevState: filterState) => ({
            ...prevState,
            category: e,
            page: 1,
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
        } else if (sorter.order) {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        } else {
            setFilters((prevState: filterState) => ({
                ...prevState,
                sortField: '',
                sort: '',
                page: 1,
            }));
            // setSearchText('');
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
        handleChangeCorporate,
        handlePageChange,
        handleDateChange,
        handleCategoryFilters,
        handleSearch,
        handleChangeFilters,
        handleFromChange,
        handleToChange,
        handleSort,
        handleTableChange,
    };
};

export default useFilter;
