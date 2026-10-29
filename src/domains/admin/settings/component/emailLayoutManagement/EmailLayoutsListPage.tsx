import { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Empty, Flex, Pagination, Tag, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { useFindRolesService } from '@utils/findRolesService';

import EmailLayoutsHeader from './EmailLayoutsHeader';
import EmailLayoutStatusPill from './EmailLayoutStatusPill';
import useGetEmailLayouts from '../../hooks/useGetEmailLayouts';
import { EmailLayoutListItem, EmailLayoutStatus, EmailLayoutType } from '../../types/emailLayout';
import { RolePermissionAccessData } from '../../types/emailTemplate';

const emailLayoutsBasePath = `${paths.systemUser.settings}/${paths.settingsAdmin.EmailLayouts}`;

const getToggleActionTooltip = (canUpdate: boolean | undefined, isActive: boolean) => {
    if (!canUpdate) return 'Sorry, you do not have permission to perform this action';
    return isActive ? 'Deactivate' : 'Activate';
};

const EmailLayoutsListPage = () => {
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [typeFilter, setTypeFilter] = useState<EmailLayoutType | ''>('');
    const [statusFilter, setStatusFilter] = useState<EmailLayoutStatus | ''>('');
    const [page, setPage] = useState(1);
    const [layoutForActiveToggle, setLayoutForActiveToggle] = useState<EmailLayoutListItem>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    // Layouts has no permission entry of its own; reuse "Email Templates" so direct navigation can't bypass the gate.
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Email Templates');
    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { tableData, isLoading, count, setLayoutActiveStatus } = useGetEmailLayouts({
        page,
        itemsPerPage: 10,
        search: searchText,
        type: typeFilter,
        status: statusFilter,
    });

    const hasActiveFilters = Boolean(searchText || typeFilter || statusFilter);

    const resetToFirstPage = () => setPage(1);
    const handleSearchChange = (value: string) => {
        setSearchText(value);
        resetToFirstPage();
    };
    const handleTypeFilterChange = (value: EmailLayoutType | '') => {
        setTypeFilter(value);
        resetToFirstPage();
    };
    const handleStatusFilterChange = (value: EmailLayoutStatus | '') => {
        setStatusFilter(value);
        resetToFirstPage();
    };

    const handleCreateLayout = () => navigate(`${emailLayoutsBasePath}/new`);
    const handleEdit = (layout: EmailLayoutListItem) =>
        navigate(`${emailLayoutsBasePath}/${layout.id}`);

    const handleConfirmActiveToggle = async () => {
        if (!layoutForActiveToggle) return;
        await setLayoutActiveStatus(layoutForActiveToggle.id, !layoutForActiveToggle.isActive);
        setLayoutForActiveToggle(undefined);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Layout Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: EmailLayoutType) => (
                <Tag color={type === 'HEADER' ? 'blue' : 'purple'}>
                    {type === 'HEADER' ? 'Header' : 'Footer'}
                </Tag>
            ),
        },
        {
            title: 'Layout Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: EmailLayoutStatus) => <EmailLayoutStatusPill status={status} />,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: EmailLayoutListItem) => (
                <Tooltip
                    placement="top"
                    title={getToggleActionTooltip(accessPermission?.update, isActive)}
                >
                    <span>
                        {isActive ? (
                            <CheckOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-textLime' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update && setLayoutForActiveToggle(record)
                                }
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-brandColor' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update && setLayoutForActiveToggle(record)
                                }
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: unknown, record: EmailLayoutListItem) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : 'Edit'
                    }
                >
                    <span>
                        {accessPermission?.update ? (
                            <EditOutlined
                                className="cursor-pointer"
                                onClick={() => handleEdit(record)}
                            />
                        ) : (
                            <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                        )}
                    </span>
                </Tooltip>
            ),
        },
    ];

    const emptyStateDescription = hasActiveFilters
        ? 'No layouts match your search or filters.'
        : 'No email layouts exist.';

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={4}>
                <Typography.Text className="text-lg font-medium sm:text-xl">
                    Email Layouts
                </Typography.Text>
                <Typography.Text className="text-textGray text-sm">
                    Manage the reusable header and footer layouts used across email templates.
                </Typography.Text>
            </Flex>
            <EmailLayoutsHeader
                searchText={searchText}
                onSearchChange={handleSearchChange}
                typeFilter={typeFilter}
                onTypeFilterChange={handleTypeFilterChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                onCreateLayout={handleCreateLayout}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={(record: EmailLayoutListItem) => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Flex justify="center" align="center" className="w-full py-16">
                            <Empty description={emptyStateDescription} />
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
            {layoutForActiveToggle && (
                <ConfirmationModal
                    isOpen
                    title={
                        layoutForActiveToggle.isActive
                            ? 'Deactivate Email Layout?'
                            : 'Activate Email Layout?'
                    }
                    description={
                        layoutForActiveToggle.isActive
                            ? `Are you sure you want to deactivate "${layoutForActiveToggle.name}"?`
                            : `Are you sure you want to activate "${layoutForActiveToggle.name}"?`
                    }
                    handleCancel={() => setLayoutForActiveToggle(undefined)}
                    handleSubmit={handleConfirmActiveToggle}
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default EmailLayoutsListPage;
