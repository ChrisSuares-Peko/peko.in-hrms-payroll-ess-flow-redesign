import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select } from 'antd';

import { snakeCaseToSentenceCase } from '@utils/wordFormat';

import { useEmailTemplateServices } from '../../hooks/useEmailTemplateMetadata';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import { EmailTemplateStatus, RolePermissionAccessData } from '../../types/emailTemplate';

type EmailTemplatesHeaderProps = {
    searchText: string;
    onSearchChange: (value: string) => void;
    serviceFilter: string;
    onServiceFilterChange: (value: string) => void;
    partnerFilter: string | number | null | '';
    onPartnerFilterChange: (value: string | number | null | '') => void;
    statusFilter: EmailTemplateStatus | '';
    onStatusFilterChange: (value: EmailTemplateStatus | '') => void;
    onCreateTemplate: () => void;
    onImportTemplates: () => void;
    onManageLayouts: () => void;
    onManageVariables: () => void;
    accessPermission?: RolePermissionAccessData;
};

const EmailTemplatesHeader = ({
    searchText,
    onSearchChange,
    serviceFilter,
    onServiceFilterChange,
    partnerFilter,
    onPartnerFilterChange,
    statusFilter,
    onStatusFilterChange,
    onCreateTemplate,
    onImportTemplates,
    onManageLayouts,
    onManageVariables,
    accessPermission,
}: EmailTemplatesHeaderProps) => {
    const { services, loading: isLoadingServices } = useEmailTemplateServices();
    const { partnerData } = usePartnersForCorporate('');

    return (
        <Flex wrap="wrap" justify="space-between" align="center" gap={12} className="w-full">
            <Flex wrap="wrap" gap={12} className="w-full md:w-auto">
                <Input
                    value={searchText}
                    placeholder="Search by name, key or service"
                    suffix={<SearchOutlined />}
                    onChange={e => onSearchChange(e.target.value)}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                    className="w-full sm:w-64"
                />
                <Select
                    value={serviceFilter || undefined}
                    placeholder="Filter by service"
                    onChange={value => onServiceFilterChange(value ?? '')}
                    allowClear
                    loading={isLoadingServices}
                    showSearch
                    optionFilterProp="label"
                    className="w-full sm:w-40"
                    options={services.map(value => ({
                        value,
                        label: snakeCaseToSentenceCase(value),
                    }))}
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
                <Select
                    value={partnerFilter === '' ? undefined : partnerFilter}
                    placeholder="Select Partner"
                    onChange={value => onPartnerFilterChange(value === undefined ? '' : value)}
                    allowClear
                    className="w-full sm:w-52"
                    options={partnerData}
                />
            </Flex>
            {accessPermission && accessPermission.write && (
                <Flex gap={12} className="w-full sm:w-fit">
                    <Button className="w-full sm:w-fit" onClick={onManageLayouts}>
                        Layout
                    </Button>
                    <Button className="w-full sm:w-fit" onClick={onManageVariables}>
                        Variables
                    </Button>
                    <Button className="w-full sm:w-fit" onClick={onImportTemplates}>
                        Import
                    </Button>
                    <Button
                        type="primary"
                        danger
                        className="w-full sm:w-fit"
                        onClick={onCreateTemplate}
                    >
                        Create Template
                    </Button>
                </Flex>
            )}
        </Flex>
    );
};

export default EmailTemplatesHeader;
