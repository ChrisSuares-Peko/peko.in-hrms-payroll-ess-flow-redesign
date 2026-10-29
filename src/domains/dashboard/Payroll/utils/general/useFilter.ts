import { PaginationProps } from 'antd';

import { filterState } from '../../types/salaryProfileTypes/employeeSalaryTable';

interface Props {
    setFilter: (value: any) => void;
    onMonthChange?: (month: number) => void;
    onYearChange?: (year: number) => void;
}

const useFilter = ({ setFilter, onMonthChange, onYearChange }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handleChangeMonth = (selectedOption: string | number) => {
        const month = parseInt(selectedOption?.toString(), 10);
        setFilter((prevState: filterState) => ({
            ...prevState,
            month: selectedOption,
            page: 1,
        }));
        if (onMonthChange) {
            onMonthChange(month);
        }
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            page,
        }));
    };
    const handlePagination: PaginationProps['onChange'] = (page, limit) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            page,
            limit,
        }));
    };
    const handleFilter = (sort: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            filter: sort && sort[0],
            page: 1,
        }));
    };
    const handleSort = (sort: string) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            sort,
        }));
    };
    const handleChangeYear = (selectedOption: number) => {
        const year = parseInt(selectedOption.toString(), 10);

        setFilter((prevState: filterState) => ({
            ...prevState,
            year: selectedOption,
            page: 1,
        }));
        if (onYearChange) {
            onYearChange(year);
        }
    };

    return {
        handleSearch,
        handlePageChange,
        handleFilter,
        handleSort,
        handleChangeYear,
        handleChangeMonth,
        handlePagination,
    };
};

export default useFilter;
