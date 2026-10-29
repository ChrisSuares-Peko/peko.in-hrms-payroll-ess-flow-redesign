import { useState } from 'react';

import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Pagination, Select, Tag, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import EmailTemplateKeyModal from './EmailTemplateKeyModal';
import EmailTemplateKeyVariablesModal from './EmailTemplateKeyVariablesModal';
import useGetEmailTemplateKeys from '../../../hooks/useGetEmailTemplateKeys';
import useGetEmailTemplateServices from '../../../hooks/useGetEmailTemplateServices';
import { EmailTemplateKey } from '../../../types/emailTemplateKey';

// This feeds a filter dropdown, not a paged table — it needs every service, not
// just the hook's default page of 10.
const ALL_SERVICES_ITEMS_PER_PAGE = 1000;

const EmailTemplateKeysTab = () => {
    const [searchText, setSearchText] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [keyForActiveToggle, setKeyForActiveToggle] = useState<EmailTemplateKey>();
    const [keyForVariables, setKeyForVariables] = useState<EmailTemplateKey | null>(null);

    const { services } = useGetEmailTemplateServices({ itemsPerPage: ALL_SERVICES_ITEMS_PER_PAGE });
    const { keys, isLoading, count, setRefresh, createKey, setKeyActiveStatus } =
        useGetEmailTemplateKeys({
            search: searchText,
            service: serviceFilter,
            isActive: activeFilter === '' ? undefined : activeFilter === 'true',
            page,
            itemsPerPage: 10,
        });

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setPage(1);
    };
    const handleServiceFilterChange = (value: string) => {
        setServiceFilter(value);
        setPage(1);
    };
    const handleActiveFilterChange = (value: '' | 'true' | 'false') => {
        setActiveFilter(value);
        setPage(1);
    };

    const handleConfirmActiveToggle = async () => {
        if (!keyForActiveToggle) return;
        await setKeyActiveStatus(keyForActiveToggle.id, !keyForActiveToggle.isActive);
        setKeyForActiveToggle(undefined);
    };

    const columns = [
        {
            title: 'Template Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => <Typography.Text code>{key}</Typography.Text>,
        },
        {
            title: 'Service',
            dataIndex: 'service',
            key: 'service',
            render: (service: string) => <Tag>{service}</Tag>,
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text className="text-textGray text-xs">
                        {formattedTime(new Date(createdAt))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Updated By',
            dataIndex: 'updatedBy',
            key: 'updatedBy',
            render: (value: string | null) => value || '—',
        },
        {
            title: 'Variables',
            dataIndex: 'variables',
            key: 'variables',
            render: (_: unknown, record: EmailTemplateKey) => (
                <Button type="link" className="p-0" onClick={() => setKeyForVariables(record)}>
                    {Object.keys(record.variables ?? {}).length} variable
                    {Object.keys(record.variables ?? {}).length === 1 ? '' : 's'}
                </Button>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: EmailTemplateKey) => (
                <Tooltip placement="top" title={isActive ? 'Deactivate' : 'Activate'}>
                    {isActive ? (
                        <CheckOutlined
                            className="cursor-pointer text-textLime"
                            onClick={() => setKeyForActiveToggle(record)}
                        />
                    ) : (
                        <CloseOutlined
                            className="cursor-pointer text-brandColor"
                            onClick={() => setKeyForActiveToggle(record)}
                        />
                    )}
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Flex wrap="wrap" justify="space-between" align="center" gap={12} className="w-full">
                <Flex wrap="wrap" gap={12} className="w-full md:w-auto">
                    <Input
                        value={searchText}
                        placeholder="Search by template key"
                        suffix={<SearchOutlined />}
                        onChange={e => handleSearchChange(e.target.value)}
                        allowClear
                        maxLength={100}
                        className="w-full sm:w-64"
                    />
                    <Select
                        value={serviceFilter || undefined}
                        placeholder="Filter by service"
                        onChange={value => handleServiceFilterChange(value ?? '')}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        className="w-full sm:w-48"
                        options={services.map(service => ({
                            value: service.key,
                            label: service.key,
                        }))}
                    />
                    <Select
                        value={activeFilter || undefined}
                        placeholder="All Statuses"
                        onChange={value => handleActiveFilterChange(value ?? '')}
                        allowClear
                        className="w-full sm:w-40"
                        options={[
                            { value: 'true', label: 'Active' },
                            { value: 'false', label: 'Inactive' },
                        ]}
                    />
                </Flex>
                <Button type="primary" danger onClick={() => setIsCreateModalOpen(true)}>
                    Create Key
                </Button>
            </Flex>
            <GenericTable
                rowKey={(record: EmailTemplateKey) => record.id}
                columns={columns}
                dataSource={keys}
                pagination={false}
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Flex justify="center" align="center" className="w-full py-16">
                            <Empty
                                description={
                                    searchText || serviceFilter
                                        ? 'No keys match your search or filters.'
                                        : 'No email template keys exist yet.'
                                }
                            />
                        </Flex>
                    ),
                }}
            />
            <Pagination
                current={page}
                pageSize={10}
                total={count}
                onChange={setPage}
                showSizeChanger={false}
                className="text-end"
            />
            <EmailTemplateKeyModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={createKey}
            />
            <EmailTemplateKeyVariablesModal
                emailTemplateKey={keyForVariables}
                onClose={() => setKeyForVariables(null)}
                onUpdated={() => setRefresh(true)}
            />
            {keyForActiveToggle && (
                <ConfirmationModal
                    isOpen
                    title={keyForActiveToggle.isActive ? 'Deactivate Key?' : 'Activate Key?'}
                    description={
                        keyForActiveToggle.isActive
                            ? `Are you sure you want to deactivate "${keyForActiveToggle.key}"?`
                            : `Are you sure you want to activate "${keyForActiveToggle.key}"?`
                    }
                    handleCancel={() => setKeyForActiveToggle(undefined)}
                    handleSubmit={handleConfirmActiveToggle}
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default EmailTemplateKeysTab;
