import { PaginationProps } from 'antd';

import { filterState } from '../types/general';

interface Props {
    setFilter: (value: any) => void;
}

const useFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handleChangeMonth = (selectedOption: string | number) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            month: selectedOption,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            page,
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
        setFilter((prevState: filterState) => ({
            ...prevState,
            year: selectedOption,
            page: 1,
        }));
    };

    return {
        handleSearch,
        handlePageChange,
        handleFilter,
        handleSort,
        handleChangeYear,
        handleChangeMonth,
    };
};

export default useFilter;
