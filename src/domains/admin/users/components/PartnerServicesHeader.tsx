import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';

type Props = {
    searchText: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleAssignPermission: () => void;
    accessPermission?: any;
};

const PartnerServicesHeader = ({
    searchText,
    handleSearch,
    handleAssignPermission,
    accessPermission,
}: Props) => (
    <Flex justify="flex-end" gap={12} className="w-full">
        {accessPermission && accessPermission.write && (
            <Button type="primary" danger onClick={handleAssignPermission}>
                Assign Permission
            </Button>
        )}
        <Input
            value={searchText}
            placeholder="Search For Partners"
            suffix={<SearchOutlined />}
            onChange={handleSearch}
            allowClear
            type="text"
            variant="outlined"
            maxLength={100}
            style={{ width: 220 }}
        />
    </Flex>
);

export default PartnerServicesHeader;
