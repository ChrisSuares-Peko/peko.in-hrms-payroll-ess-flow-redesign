import { PaginationProps } from 'antd';
import { RangePickerProps } from 'antd/es/date-picker/generatePicker/interface';
import { Dayjs } from 'dayjs';

import { InitialValues, filtersState } from '../types/dashboard';

interface Props {
    setFilters: (value: any) => void;
    initaialValues?: InitialValues;
}

const useFilter = ({ setFilters, initaialValues }: Props) => {
    const handleSearch = (e: any) => {
        setFilters((prevState: filtersState) => ({
            ...prevState,
            searchQuery: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: filtersState) => ({
            ...prevState,
            page,
        }));
    };
    const handleFilter = (sort: any) => {
        setFilters((prevState: filtersState) => ({
            ...prevState,
            filter: sort && sort[0],
            page: 1,
        }));
    };
    const handleSort = (sort: string) => {
        setFilters((prevState: filtersState) => ({
            ...prevState,
            sort,
        }));
    };
    const handleDateChange: RangePickerProps<Dayjs>['onChange'] = (dates, dateStrings) => {
        if (dates === null) {
            setFilters((prevState: filtersState) => ({
                ...prevState,
                from: initaialValues && initaialValues.from,
                to: initaialValues && initaialValues.to,
                page: 1,
            }));
        } else {
            setFilters((prevState: filtersState) => ({
                ...prevState,
                from: dateStrings[0],
                to: dateStrings[1],
                page: 1,
            }));
        }
    };
    return {
        handleSearch,
        handlePageChange,
        handleFilter,
        handleSort,
        handleDateChange,
    };
};

export default useFilter;
