import React, { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Select } from 'antd';

import useDebounce from '@src/hooks/useDebounce';
import { removeEmoji } from '@utils/regex';

import { useCompanyDocList } from '../../hooks/dashboardHooks/useCompanyDocList';

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
    const { data, count, isLoading } = useCompanyDocList(
        debouncedSearch,
        category ? category.replaceAll('-', ' ') : '',
        page ?? 1,
        pageSize || 12,
        sortBy,
        sortType
    );

    useEffect(() => {
        setIsloading(isLoading);
        docsData(data);
        setcount(count);
    }, [isLoading, data, count, setIsloading, docsData, setcount]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let filteredValue = e.target.value;
        filteredValue = filteredValue.replace(removeEmoji, '');
        setSearchKey(filteredValue);
        if (filteredValue !== searchKey) {
            setIsloading(true);
        }
    };

    const handleSortChange = (value: string) => {
        setSortBy(value === 'latest' || value === 'oldest' ? 'createdAt' : 'documentName');
        setSortType(value === 'latest' || value === 'z-a' ? 'DESC' : 'ASC');
        setIsloading(true);
    };

    return (
        <Flex gap={10} className="flex-col sm:flex-row">
            <Input
                placeholder="Search For Documents"
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                value={searchKey}
                style={{
                    width: 'calc(100% - 10px)',
                    // borderTopRightRadius: 0,
                    // borderBottomRightRadius: 0,
                }}
                onChange={handleSearchChange}
                maxLength={100}
                className=" "
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
