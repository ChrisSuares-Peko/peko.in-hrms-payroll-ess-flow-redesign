import { PaginationProps } from 'antd';

import { FilterState } from '../types/index';

interface Props {
    setFilter: (value: any) => void;
}

const useFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: FilterState) => ({
            ...prevState,
            search: e.target.value,
            start: 1,
        }));
    };

    const handlePageChange: PaginationProps['onChange'] = (start, length) => {
        setFilter((prevState: FilterState) => ({
            ...prevState,
            start,
            length,
        }));
    };

    return {
        handleSearch,
        handlePageChange,
    };
};

export default useFilter;
