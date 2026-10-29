import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { DatePicker, Flex, Input, Row } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface Props {
    searchText: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    from: string;
    to: string;
    onDateChange: (from: string, to: string) => void;
}

const DomainHostingCancellationsHeader = ({
    searchText,
    handleSearch,
    from,
    to,
    onDateChange,
}: Props) => (
    <Row justify="space-between" className="w-full gap-3 mb-4">
        <Flex className="flex justify-start gap-3 items-center">
            <RangePicker
                value={[dayjs(from), dayjs(to)]}
                onChange={(_, dateStrings) => {
                    if (dateStrings[0] && dateStrings[1]) {
                        onDateChange(dateStrings[0], dateStrings[1]);
                    }
                }}
                allowClear={false}
            />
        </Flex>
        <Input
            value={searchText}
            placeholder="Search by Txn ID or payment mode"
            suffix={<SearchOutlined />}
            onChange={handleSearch}
            allowClear
            className="max-w-xs"
        />
    </Row>
);

export default DomainHostingCancellationsHeader;
