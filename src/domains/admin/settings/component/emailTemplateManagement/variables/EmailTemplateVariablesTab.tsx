import { useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Empty, Flex, Input, Pagination, Select, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import EmailTemplateKeyVariablesModal from './EmailTemplateKeyVariablesModal';
import useGetEmailTemplateKeys from '../../../hooks/useGetEmailTemplateKeys';
import useGetEmailTemplateServices from '../../../hooks/useGetEmailTemplateServices';
import { EmailTemplateKey } from '../../../types/emailTemplateKey';

// This feeds a filter dropdown, not a paged table — it needs every service, not
// just the hook's default page of 10.
const ALL_SERVICES_ITEMS_PER_PAGE = 1000;

// A second, editable view of the Keys list centered on variable management — same
// filters and rows as the Keys tab, but with a Variables column and an edit action
// that opens the same drawer directly from here. No create button; that stays on
// the Keys tab.
const EmailTemplateVariablesTab = () => {
    const [searchText, setSearchText] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
    const [page, setPage] = useState(1);
    const [keyForVariables, setKeyForVariables] = useState<EmailTemplateKey | null>(null);
    const [keyForActiveToggle, setKeyForActiveToggle] = useState<EmailTemplateKey>();

    const { services } = useGetEmailTemplateServices({ itemsPerPage: ALL_SERVICES_ITEMS_PER_PAGE });
    const { keys, isLoading, count, setRefresh, setKeyActiveStatus } = useGetEmailTemplateKeys({
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

    const handleVariablesSaved = () => {
        setKeyForVariables(null);
        setRefresh(true);
    };

    const handleConfirmActiveToggle = async () => {
        if (!keyForActiveToggle) return;
        await setKeyActiveStatus(keyForActiveToggle.id, !keyForActiveToggle.isActive);
        setKeyForActiveToggle(undefined);
    };

    const columns = [
        {
            title: 'Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => <Typography.Text code>{key}</Typography.Text>,
        },
        {
            title: 'Service',
            dataIndex: 'service',
            key: 'service',
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
        {
            title: 'Variables',
            dataIndex: 'variables',
            key: 'variables',
            render: (variables: EmailTemplateKey['variables']) => {
                const names = Object.keys(variables || {});
                return names.length ? (
                    <Typography.Paragraph ellipsis={{ rows: 1 }} className="!mb-0 max-w-xs">
                        {names.join(', ')}
                    </Typography.Paragraph>
                ) : (
                    <Typography.Text className="text-textGray">None</Typography.Text>
                );
            },
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: unknown, record: EmailTemplateKey) => (
                <Tooltip placement="top" title="Manage Variables">
                    <EditOutlined
                        className="cursor-pointer"
                        onClick={() => setKeyForVariables(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Flex wrap="wrap" gap={12}>
                <Input
                    value={searchText}
                    placeholder="Search by key"
                    onChange={e => handleSearchChange(e.target.value)}
                    allowClear
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
            <GenericTable
                rowKey={(record: EmailTemplateKey) => record.id}
                columns={columns}
                dataSource={keys}
                pagination={false}
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Flex justify="center" align="center" className="w-full py-16">
                            <Empty description="No email template keys exist." />
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
            <EmailTemplateKeyVariablesModal
                emailTemplateKey={keyForVariables}
                onClose={() => setKeyForVariables(null)}
                onUpdated={handleVariablesSaved}
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

export default EmailTemplateVariablesTab;
