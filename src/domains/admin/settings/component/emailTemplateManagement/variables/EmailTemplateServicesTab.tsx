import { useState } from 'react';

import { CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Pagination, Select, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import EmailTemplateServiceModal from './EmailTemplateServiceModal';
import useGetEmailTemplateServices from '../../../hooks/useGetEmailTemplateServices';
import { EmailTemplateService } from '../../../types/emailTemplateService';

const EmailTemplateServicesTab = () => {
    const [searchText, setSearchText] = useState('');
    const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [serviceForActiveToggle, setServiceForActiveToggle] = useState<EmailTemplateService>();

    const { services, isLoading, count, createService, setServiceActiveStatus } =
        useGetEmailTemplateServices({
            search: searchText,
            isActive: activeFilter === '' ? undefined : activeFilter === 'true',
            page,
            itemsPerPage: 10,
        });

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setPage(1);
    };
    const handleActiveFilterChange = (value: '' | 'true' | 'false') => {
        setActiveFilter(value);
        setPage(1);
    };

    const handleConfirmActiveToggle = async () => {
        if (!serviceForActiveToggle) return;
        await setServiceActiveStatus(serviceForActiveToggle.id, !serviceForActiveToggle.isActive);
        setServiceForActiveToggle(undefined);
    };

    const columns = [
        {
            title: 'Service Key',
            dataIndex: 'key',
            key: 'key',
            render: (key: string) => <Typography.Text code>{key}</Typography.Text>,
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
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: EmailTemplateService) => (
                <Tooltip placement="top" title={isActive ? 'Deactivate' : 'Activate'}>
                    {isActive ? (
                        <CheckOutlined
                            className="cursor-pointer text-textLime"
                            onClick={() => setServiceForActiveToggle(record)}
                        />
                    ) : (
                        <CloseOutlined
                            className="cursor-pointer text-brandColor"
                            onClick={() => setServiceForActiveToggle(record)}
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
                        placeholder="Search by service key"
                        suffix={<SearchOutlined />}
                        onChange={e => handleSearchChange(e.target.value)}
                        allowClear
                        maxLength={50}
                        className="w-full sm:w-64"
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
                    Create Service
                </Button>
            </Flex>
            <GenericTable
                rowKey={(record: EmailTemplateService) => record.id}
                columns={columns}
                dataSource={services}
                pagination={false}
                loading={isLoading}
                locale={{
                    emptyText: (
                        <Flex justify="center" align="center" className="w-full py-16">
                            <Empty
                                description={
                                    searchText
                                        ? 'No services match your search.'
                                        : 'No email template services exist yet.'
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
            <EmailTemplateServiceModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={createService}
            />
            {serviceForActiveToggle && (
                <ConfirmationModal
                    isOpen
                    title={
                        serviceForActiveToggle.isActive
                            ? 'Deactivate Service?'
                            : 'Activate Service?'
                    }
                    description={
                        serviceForActiveToggle.isActive
                            ? `Are you sure you want to deactivate "${serviceForActiveToggle.key}"?`
                            : `Are you sure you want to activate "${serviceForActiveToggle.key}"?`
                    }
                    handleCancel={() => setServiceForActiveToggle(undefined)}
                    handleSubmit={handleConfirmActiveToggle}
                    isLoading={false}
                />
            )}
        </Flex>
    );
};

export default EmailTemplateServicesTab;
