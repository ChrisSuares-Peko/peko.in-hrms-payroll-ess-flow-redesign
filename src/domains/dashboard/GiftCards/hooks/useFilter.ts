import { PaginationProps } from 'antd';

import { filterState } from '../types/types';

interface Props {
    setFilter: (value: any) => void;
}

const useFilter = ({ setFilter }: Props) => {
    const handleSearch = (e: any) => {
        setFilter((prevState: filterState) => ({
            ...prevState,
            search: e.target.value,
            start: 1,
        }));
    };

    const handlePageChange: PaginationProps['onChange'] = (start, length) => {
        setFilter((prevState: filterState) => ({
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
