import { useCallback } from 'react';

import { DatePickerProps, PaginationProps } from 'antd';

import { filterState } from '../types/index';

interface Props {
    setFilters: (value: any) => void;
    initalStartDate: string;
    initalEndDate: string;
}

const useFilter = ({ setFilters, initalStartDate, initalEndDate }: Props) => {
    const handlePageChange: PaginationProps['onChange'] = useCallback(
        (page: any) => {
            setFilters((prevState: filterState) => ({
                ...prevState,
                page,
            }));
        },
        [setFilters]
    );

    const handleDateChange = useCallback(
        (dates: any, dateStrings: any[]) => {
            if (dates === null) {
                setFilters((prevState: filterState) => ({
                    ...prevState,
                    from: initalStartDate,
                    to: initalEndDate,
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
        },
        [setFilters, initalStartDate, initalEndDate]
    );

    const handleSearch = useCallback(
        (e: any) => {
            setFilters((prevState: filterState) => ({
                ...prevState,
                search: e.target.value,
                page: 1,
            }));
        },
        [setFilters]
    );

    const handleFromChange: DatePickerProps['onChange'] = useCallback(
        (date: any, dateString: any) => {
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
        },
        [setFilters, initalStartDate]
    );

    const handleToChange: DatePickerProps['onChange'] = useCallback(
        (date: any, dateString: any) => {
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
        },
        [setFilters, initalEndDate]
    );

    return {
        handlePageChange,
        handleDateChange,
        handleSearch,
        handleFromChange,
        handleToChange,
    };
};

export default useFilter;
