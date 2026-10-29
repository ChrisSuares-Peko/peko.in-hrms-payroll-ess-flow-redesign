import React, { useCallback, useRef, useState } from 'react';

import {
    CreditCardOutlined,
    FileSearchOutlined,
    PlusOutlined,
    SearchOutlined,
    SettingOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Empty, Flex, Input, Pagination, Select, Tag, Tooltip, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@routes/paths';
import { formattedDateOnly } from '@utils/dateFormat';

import ManageApplicationDrawer from './ManageApplicationDrawer';
import OverviewCards from './OverviewCards';
import { KYB_STATUS_META, KYB_STATUS_OPTIONS } from './statusMeta';
import useCorporateCardApplications from '../../hooks/useCorporateCardApplications';
import { CorporateCardApplicationRow, KybStatus } from '../../types/corporateCardApplications';

const initialFilters = { searchText: '', status: '' as KybStatus | '', page: 1, itemsPerPage: 10 };

const NotSet = () => (
    <Typography.Text className="text-xs italic text-textGreyLight">Not set</Typography.Text>
);

const CorporateCardApplications = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState(initialFilters);
    const [searchText, setSearchText] = useState('');
    const [drawer, setDrawer] = useState<{
        mode: 'create' | 'edit';
        row: CorporateCardApplicationRow | null;
    } | null>(null);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trimStart();
        setSearchText(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, searchText: value, page: 1 }));
        }, 300);
    }, []);

    const handleStatusFilter = (value: KybStatus | '') => {
        setFilters(prev => ({ ...prev, status: value, page: 1 }));
    };

    const { isLoading, tableData, count, summary, refetch } = useCorporateCardApplications(filters);
    const hasActiveFilters = Boolean(filters.searchText || filters.status);

    const columns = [
        {
            title: 'Corporate',
            dataIndex: 'companyName',
            key: 'companyName',
            width: 220,
            render: (val: string | null, row: CorporateCardApplicationRow) => {
                const primaryName = row.entityName || val || row.fullName || 'Unnamed corporate';
                const secondaryName =
                    [val, row.fullName].find(name => Boolean(name) && name !== primaryName) || null;
                return (
                    <Flex vertical className="max-w-[220px]">
                        <Typography.Text
                            ellipsis={{ tooltip: primaryName }}
                            className="font-medium text-textHeadings"
                        >
                            {primaryName}
                        </Typography.Text>
                        {secondaryName && (
                            <Typography.Text
                                ellipsis={{ tooltip: secondaryName }}
                                className="text-xs text-textGreyLight"
                            >
                                {secondaryName}
                            </Typography.Text>
                        )}
                        {row.pekoAccountNumber && (
                            <Typography.Text className="text-xs text-textGreyLight">
                                {row.pekoAccountNumber}
                            </Typography.Text>
                        )}
                    </Flex>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'kybStatus',
            key: 'kybStatus',
            width: 120,
            render: (status: KybStatus, record: CorporateCardApplicationRow) => {
                const meta = KYB_STATUS_META[status] ?? KYB_STATUS_META.PENDING;
                return (
                    <Flex align="center" gap={6}>
                        <Tag
                            className="rounded-full border-0 px-3 py-0.5 text-xs font-medium"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                        >
                            {meta.label}
                        </Tag>
                        {status === 'UNDER_REVIEW' && record.vendorEmailStatus === false && (
                            <Tooltip title="The vendor review email did not go out. Open this application to retry.">
                                <WarningFilled className="text-sm text-warning" />
                            </Tooltip>
                        )}
                    </Flex>
                );
            },
        },
        {
            title: 'KYB Reference',
            dataIndex: 'kybReference',
            key: 'kybReference',
            width: 160,
            render: (val: string | null) =>
                val ? (
                    <Typography.Text
                        copyable={{ text: val }}
                        ellipsis={{ tooltip: val }}
                        className="font-mono text-sm"
                    >
                        {val}
                    </Typography.Text>
                ) : (
                    <NotSet />
                ),
        },
        {
            title: 'Card Scheme',
            dataIndex: 'cardSchemeId',
            key: 'cardSchemeId',
            width: 120,
            render: (val: number | null) =>
                val ? <Typography.Text>{val}</Typography.Text> : <NotSet />,
        },
        {
            title: 'SVC Card',
            dataIndex: 'svcCardNumberLast4',
            key: 'svcCardNumberLast4',
            width: 130,
            render: (val: string | null) =>
                val ? (
                    <Typography.Text className="font-mono">•••• {val}</Typography.Text>
                ) : (
                    <NotSet />
                ),
        },
        {
            title: 'Virtual Account',
            key: 'virtualAccount',
            width: 170,
            render: (_: unknown, row: CorporateCardApplicationRow) =>
                row.virtualAccountNumberLast4 ? (
                    <Flex vertical>
                        <Typography.Text className="font-mono">
                            •••• {row.virtualAccountNumberLast4}
                        </Typography.Text>
                        <Typography.Text className="text-xs text-textGreyLight">
                            {row.virtualAccountIfsc || ''}
                        </Typography.Text>
                    </Flex>
                ) : (
                    <NotSet />
                ),
        },
        {
            title: 'Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            width: 130,
            render: (val: string) => (
                <Typography.Text className="text-sm">
                    {val ? formattedDateOnly(new Date(val)) : '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Uploaded Documents',
            key: 'uploadedDocuments',
            width: 150,
            render: (_: unknown, row: CorporateCardApplicationRow) => (
                <Tooltip title="View uploaded documents">
                    <Button
                        size="small"
                        icon={<FileSearchOutlined />}
                        aria-label={`View documents for ${row.companyName || row.corporateId}`}
                        onClick={() =>
                            navigate(
                                `${paths.systemUser.manage}/${paths.manage.corporateCardApplications}/${row.corporateId}/documents`,
                                {
                                    state: {
                                        companyName: row.companyName,
                                        email: row.email,
                                        fullName: row.fullName,
                                        pekoAccountNumber: row.pekoAccountNumber,
                                    },
                                }
                            )
                        }
                    >
                        View
                    </Button>
                </Tooltip>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 110,
            render: (_: unknown, row: CorporateCardApplicationRow) => (
                <Tooltip title="Manage application">
                    <Button
                        size="small"
                        icon={<SettingOutlined />}
                        aria-label={`Manage ${row.companyName || row.corporateId}`}
                        onClick={() => setDrawer({ mode: 'edit', row })}
                    >
                        Manage
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            {/* Page header — icon chip + title/subtitle, action on the right */}
            <Flex justify="space-between" align="start" wrap gap={12}>
                <Flex align="center" gap={12}>
                    <div className="flex size-10 items-center justify-center rounded-xl bg-bgIconCard">
                        <CreditCardOutlined className="text-xl text-brandColor" />
                    </div>
                    <Flex vertical gap={2}>
                        <Typography.Title level={4} className="!mb-0">
                            Corporate Card Applications
                        </Typography.Title>
                        <Typography.Text className="text-sm text-textBody">
                            Provision the card scheme, SVC card, and virtual account each corporate
                            tops up into.
                        </Typography.Text>
                    </Flex>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="w-full sm:w-auto"
                    onClick={() => setDrawer({ mode: 'create', row: null })}
                >
                    Add Application
                </Button>
            </Flex>

            <OverviewCards
                summary={summary}
                loading={isLoading}
                activeStatus={filters.status}
                onSelectStatus={handleStatusFilter}
            />

            {/* Filters + table + pagination, wrapped in one flat card */}
            <div className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6">
                <Flex
                    gap={12}
                    wrap
                    align="center"
                    justify="space-between"
                    className="border-b border-borderDivider pb-4"
                >
                    <Flex gap={12} wrap align="center" className="w-full sm:w-auto">
                        <Input
                            allowClear
                            prefix={<SearchOutlined className="text-textGreyColor" />}
                            placeholder="Search by name, full name or account number"
                            value={searchText}
                            onChange={handleSearch}
                            maxLength={100}
                            className="w-full sm:w-[280px]"
                        />
                        <Select<KybStatus | undefined>
                            allowClear
                            placeholder="Filter by status"
                            options={KYB_STATUS_OPTIONS}
                            value={filters.status || undefined}
                            onChange={value => handleStatusFilter(value || '')}
                            className="w-full sm:w-[170px]"
                        />
                    </Flex>
                    {!isLoading && (
                        <Tag className="rounded-full border-0 bg-bgLightGray px-3 py-1 text-xs font-medium text-textGreyColor">
                            {count} {count === 1 ? 'application' : 'applications'}
                        </Tag>
                    )}
                </Flex>

                <div className="pt-4">
                    <GenericTable
                        columns={columns}
                        dataSource={tableData}
                        loading={isLoading}
                        rowKey="corporateId"
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        hasActiveFilters
                                            ? 'No applications match your filters.'
                                            : 'No corporate card applications yet.'
                                    }
                                >
                                    {!hasActiveFilters && (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => setDrawer({ mode: 'create', row: null })}
                                        >
                                            Add Application
                                        </Button>
                                    )}
                                </Empty>
                            ),
                        }}
                    />

                    {count > 0 && (
                        <Flex justify="end" className="pt-4">
                            <Pagination
                                current={filters.page}
                                pageSize={filters.itemsPerPage}
                                total={count}
                                showSizeChanger={false}
                                hideOnSinglePage
                                onChange={page => setFilters(prev => ({ ...prev, page }))}
                            />
                        </Flex>
                    )}
                </div>
            </div>

            <ManageApplicationDrawer
                open={!!drawer}
                mode={drawer?.mode || 'edit'}
                row={drawer?.row || null}
                onClose={() => setDrawer(null)}
                onSaved={() => {
                    setDrawer(null);
                    refetch();
                }}
            />
        </Flex>
    );
};

export default CorporateCardApplications;
