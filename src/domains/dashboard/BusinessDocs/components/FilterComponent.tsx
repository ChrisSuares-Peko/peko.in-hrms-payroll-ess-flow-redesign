import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Select } from 'antd';

import useDebounce from '@src/hooks/useDebounce';

import { useBusinessDocsListingApi } from '../hooks/useGetDocsListApI';
import '../styles/customSelect.css';

const { Option } = Select;

type props = {
    category: string | undefined;
    docsData: any;
    page: number | undefined;
    setcount: any;
    pageSize: number | undefined;
    setIsloading: (isLoading: boolean) => void;
};

const FilterComponent = ({ category, docsData, page, setcount, pageSize, setIsloading }: props) => {
    const [searchKey, setSearchKey] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortType, setSortType] = useState<string>('DESC');

    const debouncedSearch = useDebounce(searchKey, 500);
    const formattedCategory = useMemo(
        () => (category ? category.replaceAll('-', ' ') : ''),
        [category]
    );

    const { data, count, isLoading } = useBusinessDocsListingApi(
        debouncedSearch,
        formattedCategory,
        page ?? 1,
        pageSize || 12,
        sortBy,
        sortType
    );

    useEffect(() => {
        const updateDocsData = () => {
            setIsloading(isLoading);
            docsData(data);
            setcount(count);
        };
        updateDocsData();
    }, [isLoading, data, count, setIsloading, docsData, setcount]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchKey(e.target.value);
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortBy(value === 'latest' || value === 'oldest' ? 'createdAt' : 'documentName');
        setSortType(value === 'latest' || value === 'z-a' ? 'DESC' : 'ASC');
    }, []);

    return (
        <Flex gap={10} className="flex">
            <Input
                placeholder="Search For Documents"
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                value={searchKey}
                style={{
                    width: 'calc(100% - 10px)',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                }}
                onChange={handleSearchChange}
                maxLength={100}
                className="rounded-sm "
            />
            <Select
                defaultValue="latest"
                style={{
                    width: '30%',
                    minWidth: '120px',
                    maxWidth: '200px',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                }}
                onChange={handleSortChange}
            >
                <Option value="latest">Latest</Option>
                <Option value="oldest">Oldest</Option>
                <Option value="a-z">A-Z</Option>
                <Option value="z-a">Z-A</Option>
            </Select>
        </Flex>
    );
};

export default FilterComponent;
