import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select } from 'antd';

type Props = {
    onStatusChange: (val: string | undefined) => void;
    onSearch: (val: string) => void;
    onNewRequest: () => void;
    search: string;
};

const RFQHeader: React.FC<Props> = ({ onStatusChange, onSearch, onNewRequest, search }) => (
    <Flex align="center" gap={12} wrap>
        <Select
            placeholder="Select status"
            allowClear
            className="w-full sm:w-[140px]"
            options={[
                { label: 'Active', value: 'Active' },
                { label: 'Draft',  value: 'Draft'  },
                { label: 'Closed', value: 'Closed' },
            ]}
            onChange={onStatusChange}
        />
        <Input
            placeholder="Search by title, reference no"
            suffix={<SearchOutlined />}
            allowClear
            className="w-full sm:w-[260px]"
            value={search}
            onChange={e => onSearch(e.target.value.replace(/\p{Emoji_Presentation}/gu, ''))}
            maxLength={100}
        />
        <Button type="primary" danger className="w-full sm:w-auto" onClick={onNewRequest}>
            New Request
        </Button>
    </Flex>
);

export default RFQHeader;
