import { useState } from 'react';

import { PaginationProps } from 'antd';
import { TableProps } from 'antd/lib';

import { getCorporateUsers } from '../types/partnerPermission';

interface Props {
    setFilters: (value: any) => void;
}

const useFilter = ({ setFilters }: Props) => {
    const [searchText, setSearchText] = useState<string>('');
    const handleSearch = (e: any) => {
        setFilters((prevState: getCorporateUsers) => ({
            ...prevState,
            searchText: e.target.value,
            page: 1,
        }));
    };
    const handlePageChange: PaginationProps['onChange'] = page => {
        setFilters((prevState: getCorporateUsers) => ({
            ...prevState,
            page,
        }));
    };

    const handleChangeFilters = (e: any) => {
        setFilters((prevState: getCorporateUsers) => ({
            ...prevState,
            partnerId: e,
            page: 1,
        }));
        setSearchText('');
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
            setFilters((prevState: getCorporateUsers) => ({
                ...prevState,
                sortField: '',
                sort: '',
                page: 1,
            }));
        }

        if (field) {
            handleSort(field.toString(), sort);
        }
    };

    const handleSort = (sortField: string, sort?: string) => {
        const formattedSortField = sortField.includes(',')
            ? sortField.split(',').join('.')
            : sortField;
        setFilters((prevState: getCorporateUsers) => ({
            ...prevState,
            sortField: formattedSortField,
            sort,
            page: 1,
        }));
    };
    return {
        handleSearch,
        handlePageChange,
        handleChangeFilters,
        searchText,
        setSearchText,
        handleTableChange,
    };
};

export default useFilter;
