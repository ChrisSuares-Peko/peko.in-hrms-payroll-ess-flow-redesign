import { useState } from 'react';

import { PaginationProps } from 'antd';

import { PackageQueryParams } from '../../types/subscription';

interface Props {
    setFilters: (value: any) => void;
}

const useFilter = ({ setFilters }: Props) => {
    const [searchText, setSearchText] = useState<string>('');
    const handleSearch = (e: any) => {
        setFilters((prevState: PackageQueryParams) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: PackageQueryParams) => ({
            ...prevState,
            page,
        }));
    };

    const handleChangeFilters = (e: any) => {
        setFilters((prevState: PackageQueryParams) => ({
            ...prevState,
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
    };
};

export default useFilter;
