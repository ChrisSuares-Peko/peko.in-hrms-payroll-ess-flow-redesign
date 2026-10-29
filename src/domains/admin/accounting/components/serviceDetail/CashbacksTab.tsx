import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import { ServiceData } from '@src/domains/admin/settings/types/cashback';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppDispatch } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import BulkConfigureControls from './BulkConfigureControls';
import ConfigureCashbackDrawer, { CashbackFormValues } from './ConfigureCashbackDrawer';
import TabHeader from './TabHeader';
import { SERVICE_PARTNER_PARAM } from '../../config/servicePaths';
import useAccountingServiceCashbacks from '../../hooks/useAccountingServiceCashbacks';
import useBulkRowSelection from '../../hooks/useBulkRowSelection';
import { AccountingService } from '../../types/services';
import { formatInr } from '../../utils/commission';
import StatusPill from '../common/StatusPill';

const INITIAL_FILTERS = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: '',
    sortField: '',
    partnerId: '',
};

type CashbacksTabProps = {
    service: AccountingService;
    onConfigurationChange?: () => void;
};

const CashbacksTab = ({ service, onConfigurationChange }: CashbacksTabProps) => {
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState(() => ({
        ...INITIAL_FILTERS,
        partnerId: searchParams.get(SERVICE_PARTNER_PARAM) || '',
    }));
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handleTableChange, handleChangeFilters } = useFilter({
        setFilters,
    });
    const { partnerData } = usePartnersForCorporate('');
    const { isLoading, rows, count, updateRow, bulkUpdateRows } = useAccountingServiceCashbacks(
        service.id,
        filters
    );
    const [editing, setEditing] = useState<ServiceData | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const bulkSelection = useBulkRowSelection<ServiceData>(rows, row => row.id);

    const saveBulkCashback = async (values: CashbackFormValues) => {
        const ids = bulkSelection.selectedIds;
        const success = await bulkUpdateRows(ids, values);
        dispatch(
            showToast({
                description: success
                    ? `Cashback applied to ${ids.length} selected rows`
                    : 'Failed to save cashback. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) {
            setBulkOpen(false);
            bulkSelection.reset();
            onConfigurationChange?.();
        }
    };

    const columns: GenericColumns<ServiceData> = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Partner Name',
            key: 'partnerName',
            render: (_, row) => (
                <span className="inline-flex flex-wrap items-center gap-2 font-medium">
                    {row.partnerName || 'Peko'}
                    {!row.partnerId && <StatusPill label="Default" tone="neutral" />}
                </span>
            ),
        },
        { title: 'Package Name', dataIndex: 'packageName', key: 'packageName' },
        {
            title: 'Cashback',
            key: 'cashback',
            render: (_, row) =>
                row.cashbackType === 'PERCENTAGE'
                    ? `${row.cashback}%`
                    : formatInr(Number(row.cashback)),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            neverFold: true,
            // Cashback configuration is disabled for now.
            render: (_, row) => (
                <Button disabled onClick={() => setEditing(row)}>
                    Configure
                </Button>
            ),
        },
    ];

    return (
        <div>
            <TabHeader
                title="Cashbacks"
                description={`Cashback for ${service.serviceProvider}, per partner and their purchased subscription.`}
                action={
                    <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                        <Select
                            allowClear
                            placeholder="Select Partner"
                            className="min-w-52"
                            value={filters.partnerId || undefined}
                            options={partnerData?.map(p => ({ ...p, value: String(p.value) }))}
                            onChange={value => handleChangeFilters(value)}
                        />
                        <Input
                            allowClear
                            suffix={<SearchOutlined />}
                            placeholder="Search"
                            value={searchText}
                            onChange={updateSearchText}
                        />
                        <BulkConfigureControls
                            selectionMode={bulkSelection.selectionMode}
                            selectedCount={bulkSelection.selectedRows.length}
                            disabled
                            onStart={bulkSelection.start}
                            onCancel={bulkSelection.reset}
                            onConfigure={() => setBulkOpen(true)}
                        />
                    </Flex>
                }
            />
            <GenericTable
                rowKey={(record: ServiceData) => record.id}
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
                rowSelection={bulkSelection.rowSelection}
                className="rounded-xl border border-solid border-borderCard overflow-hidden"
            />
            <Pagination
                current={filters.page}
                pageSize={filters.itemsPerPage}
                total={count}
                onChange={handlePageChange}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end mt-4"
            />
            {editing && (
                <ConfigureCashbackDrawer
                    open
                    title={`Configure cashback — ${editing.partnerName || 'Peko'}`}
                    initialValues={{
                        cashbackType: editing.cashbackType || 'PERCENTAGE',
                        cashback: editing.cashback || '',
                    }}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (values: CashbackFormValues) => {
                        const success = await updateRow(editing, values);
                        dispatch(
                            showToast({
                                description: success
                                    ? `Cashback saved for ${editing.partnerName || 'Peko'} · ${editing.packageName}`
                                    : 'Failed to save cashback. Please try again.',
                                variant: success ? 'success' : 'error',
                            })
                        );
                        if (success) {
                            setEditing(null);
                            onConfigurationChange?.();
                        }
                    }}
                />
            )}
            {bulkOpen && (
                <ConfigureCashbackDrawer
                    open
                    title={`Bulk configure — ${bulkSelection.selectedRows.length} rows`}
                    initialValues={{ cashbackType: 'PERCENTAGE', cashback: '' }}
                    onCancel={() => setBulkOpen(false)}
                    onSubmit={saveBulkCashback}
                />
            )}
        </div>
    );
};

export default CashbacksTab;
