import { useState } from 'react';

import { PaginationProps } from 'antd';

interface Props {
    setFilters: (filters: any) => void;
}

interface useFilterCommon {
    searchText: string;
    page: number;
    sortField?: string;
    sort?: string;
    partnerId?: string;
}

const useFilter = ({ setFilters }: Props) => {
    const [searchText, setSearchText] = useState<string>('');

    const handleSearch = (e: any) => {
        setSearchText(e.target.value);
    };

    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: useFilterCommon) => ({
            ...prevState,
            page,
        }));
    };

    return {
        handleSearch,
        handlePageChange,
        searchText,
        setSearchText,
    };
};

export default useFilter;
