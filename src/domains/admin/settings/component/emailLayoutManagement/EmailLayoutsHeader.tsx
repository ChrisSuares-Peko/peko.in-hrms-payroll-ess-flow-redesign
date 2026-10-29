import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select } from 'antd';

import { EmailLayoutStatus, EmailLayoutType } from '../../types/emailLayout';
import { RolePermissionAccessData } from '../../types/emailTemplate';

type EmailLayoutsHeaderProps = {
    searchText: string;
    onSearchChange: (value: string) => void;
    typeFilter: EmailLayoutType | '';
    onTypeFilterChange: (value: EmailLayoutType | '') => void;
    statusFilter: EmailLayoutStatus | '';
    onStatusFilterChange: (value: EmailLayoutStatus | '') => void;
    onCreateLayout: () => void;
    accessPermission?: RolePermissionAccessData;
};

const EmailLayoutsHeader = ({
    searchText,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
    statusFilter,
    onStatusFilterChange,
    onCreateLayout,
    accessPermission,
}: EmailLayoutsHeaderProps) => (
    <Flex wrap="wrap" justify="space-between" align="center" gap={12} className="w-full">
        <Flex wrap="wrap" gap={12} className="w-full md:w-auto">
            <Input
                value={searchText}
                placeholder="Search by name"
                suffix={<SearchOutlined />}
                onChange={e => onSearchChange(e.target.value)}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
                className="w-full sm:w-64"
            />
            <Select
                value={typeFilter || undefined}
                placeholder="Filter by type"
                onChange={value => onTypeFilterChange(value ?? '')}
                allowClear
                className="w-full sm:w-40"
                options={[
                    { value: 'HEADER', label: 'Header' },
                    { value: 'FOOTER', label: 'Footer' },
                ]}
            />
            <Select
                value={statusFilter || undefined}
                placeholder="All Statuses"
                onChange={value => onStatusFilterChange(value ?? '')}
                allowClear
                className="w-full sm:w-40"
                options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PUBLISHED', label: 'Published' },
                ]}
            />
        </Flex>
        {accessPermission && accessPermission.write && (
            <Button type="primary" danger className="w-full sm:w-fit" onClick={onCreateLayout}>
                Create Layout
            </Button>
        )}
    </Flex>
);

export default EmailLayoutsHeader;
