import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Row, Select } from 'antd';

const STATUS_OPTIONS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Reopened', value: 'reopened' },
];

interface Props {
    searchText: string;
    onSearch: (text: string) => void;
    onStatusChange: (status: string) => void;
    onDateChange: (from: string, to: string) => void;
}

const ComplianceHeader = ({ searchText, onSearch, onStatusChange, onDateChange }: Props) => {
    const [inputValue, setInputValue] = useState(searchText);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        onSearch(e.target.value);
    };

    return (
        <Row justify="end" className="w-full gap-5">
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Input
                    value={inputValue}
                    placeholder="Search by user, company or type"
                    suffix={<SearchOutlined />}
                    onChange={handleInput}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
                <Select
                    defaultValue=""
                    options={STATUS_OPTIONS}
                    onChange={onStatusChange}
                    className="w-full md:w-40"
                />
                {/* <RangePicker
                    onChange={(_, dateStrings) => onDateChange(dateStrings[0], dateStrings[1])}
                    className="w-full md:w-auto"
                /> */}
            </Flex>
        </Row>
    );
};

export default ComplianceHeader;
