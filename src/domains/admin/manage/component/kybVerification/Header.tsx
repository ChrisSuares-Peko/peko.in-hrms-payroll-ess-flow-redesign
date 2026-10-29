import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Row } from 'antd';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    setSearchText: (e: any) => void;
    searchText: string;
    setOpenModal: (e: any) => void;
};

const KybHeader = ({
    searchText,
    setSearchText,
    handleSearch,
    handleChangeFilters,
    setOpenModal,
}: Props) => {
    const [searchInput, setSearchInput] = useState(searchText);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setSearchInput(value);
        handleSearch(value); // debounced search function
    };
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Input
                    value={searchInput}
                    placeholder="Search"
                    suffix={<SearchOutlined />}
                    onChange={handleInputChange}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
        </Row>
    );
};
export default KybHeader;
