import { useEffect, useState } from 'react';

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Empty, Flex, Pagination, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { useFindRolesService } from '@utils/findRolesService';

import EmailTemplatesHeader from './EmailTemplatesHeader';
import EmailTemplateStatusPill from './EmailTemplateStatusPill';
import ImportEmailTemplatesModal from './ImportEmailTemplatesModal';
import useGetEmailTemplates from '../../hooks/useGetEmailTemplates';
import {
    EmailTemplateListItem,
    EmailTemplateStatus,
    RolePermissionAccessData,
} from '../../types/emailTemplate';

const emailTemplatesBasePath = `${paths.systemUser.settings}/${paths.settingsAdmin.EmailTemplates}`;
const emailLayoutsBasePath = `${paths.systemUser.settings}/${paths.settingsAdmin.EmailLayouts}`;

const getToggleActionTooltip = (canUpdate: boolean | undefined, isActive: boolean) => {
    if (!canUpdate) return 'Sorry, you do not have permission to perform this action';
    return isActive ? 'Deactivate' : 'Activate';
};

const EmailTemplatesListPage = () => {
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    const [partnerFilter, setPartnerFilter] = useState<string | number | null | ''>('');
    const [statusFilter, setStatusFilter] = useState<EmailTemplateStatus | ''>('');
    const [page, setPage] = useState(1);
    const [templateForActiveToggle, setTemplateForActiveToggle] = useState<EmailTemplateListItem>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Email Templates');
    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { tableData, isLoading, count, setRefresh, setTemplateActiveStatus } =
        useGetEmailTemplates({
            page,
            itemsPerPage: 10,
            searchText,
            service: serviceFilter,
            partnerId: partnerFilter === '' ? undefined : partnerFilter,
            status: statusFilter,
        });

    const hasActiveFilters = Boolean(
        searchText || serviceFilter || partnerFilter !== '' || statusFilter
    );

    const resetToFirstPage = () => setPage(1);
    const handleSearchChange = (value: string) => {
        setSearchText(value);
        resetToFirstPage();
    };
    const handleServiceFilterChange = (value: string) => {
        setServiceFilter(value);
        resetToFirstPage();
    };
    const handlePartnerFilterChange = (value: string | number | null | '') => {
        setPartnerFilter(value);
        resetToFirstPage();
    };
    const handleStatusFilterChange = (value: EmailTemplateStatus | '') => {
        setStatusFilter(value);
        resetToFirstPage();
    };

    const handleCreateTemplate = () => navigate(`${emailTemplatesBasePath}/new`);
    const handleManageLayouts = () => navigate(emailLayoutsBasePath);
    const handleManageVariables = () =>
        navigate(`${paths.systemUser.settings}/${paths.settingsAdmin.EmailTemplateVariables}`);
    const handleEdit = (template: EmailTemplateListItem) =>
        navigate(`${emailTemplatesBasePath}/${template.id}`);
    const handleImported = () => setRefresh(true);

    const handleConfirmActiveToggle = async () => {
        if (!templateForActiveToggle) return;
        await setTemplateActiveStatus(
            templateForActiveToggle.id,
            !templateForActiveToggle.isActive
        );
        setTemplateForActiveToggle(undefined);
    };

    const columns = [
        {
            title: 'Template Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Service',
            dataIndex: 'service',
            key: 'service',
        },
        {
            title: 'Template Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => <Typography.Text code>{key}</Typography.Text>,
        },
        {
            title: 'Template Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: EmailTemplateStatus) => <EmailTemplateStatusPill status={status} />,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: EmailTemplateListItem) => (
                <Tooltip
                    placement="top"
                    title={getToggleActionTooltip(accessPermission?.update, isActive)}
                >
                    <span>
                        {isActive ? (
                            <CheckOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-textDarkGreen' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update && setTemplateForActiveToggle(record)
                                }
                            />
                        ) : (
                            <CloseOutlined
                                className={`cursor-pointer ${accessPermission?.update ? 'text-brandColor' : 'text-gray-400'}`}
                                style={{
                                    cursor: accessPermission?.update ? 'pointer' : 'not-allowed',
                                }}
                                onClick={() =>
                                    accessPermission?.update && setTemplateForActiveToggle(record)
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
            render: (_: unknown, record: EmailTemplateListItem) => (
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
        ? 'No templates match your search or filters.'
        : 'No email templates exist.';

    return (
        <Flex vertical gap={20}>
            <Flex vertical gap={4}>
                <Typography.Text className="text-lg font-medium sm:text-xl">
                    Email Templates
                </Typography.Text>
                <Typography.Text className="text-textGray text-sm">
                    Manage the email templates used across the platform.
                </Typography.Text>
            </Flex>
            <EmailTemplatesHeader
                searchText={searchText}
                onSearchChange={handleSearchChange}
                serviceFilter={serviceFilter}
                onServiceFilterChange={handleServiceFilterChange}
                partnerFilter={partnerFilter}
                onPartnerFilterChange={handlePartnerFilterChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                onCreateTemplate={handleCreateTemplate}
                onImportTemplates={() => setIsImportModalOpen(true)}
                onManageLayouts={handleManageLayouts}
                onManageVariables={handleManageVariables}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={(record: EmailTemplateListItem) => record.id}
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
            {templateForActiveToggle && (
                <ConfirmationModal
                    isOpen
                    title={
                        templateForActiveToggle.isActive
                            ? 'Deactivate Email Template?'
                            : 'Activate Email Template?'
                    }
                    description={
                        templateForActiveToggle.isActive
                            ? `Are you sure you want to deactivate "${templateForActiveToggle.name}"?`
                            : `Are you sure you want to activate "${templateForActiveToggle.name}"?`
                    }
                    handleCancel={() => setTemplateForActiveToggle(undefined)}
                    handleSubmit={handleConfirmActiveToggle}
                    isLoading={false}
                />
            )}
            <ImportEmailTemplatesModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImported={handleImported}
            />
        </Flex>
    );
};

export default EmailTemplatesListPage;
