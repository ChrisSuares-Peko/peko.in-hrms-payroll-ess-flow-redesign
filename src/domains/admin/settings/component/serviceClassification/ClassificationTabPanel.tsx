import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Pagination, Tooltip, Typography } from 'antd';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import StatusPill from '@src/domains/admin/accounting/components/common/StatusPill';
import { serviceActivityPill } from '@src/domains/admin/accounting/utils/commission';
import useFilter from '@src/domains/admin/manage/hooks/useFilters';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import ClassificationRowMenu from './ClassificationRowMenu';
import useClassifyService from '../../hooks/serviceClassification/useClassifyService';
import useServiceClassification from '../../hooks/serviceClassification/useServiceClassification';
import {
    ClassifiedOperator,
    ServiceClassification as Classification,
    ServiceClassificationFilters,
    ServiceClassificationTab,
} from '../../types/serviceClassification';
import {
    classificationInSentence,
    confirmMoveText,
    confirmRemoveText,
    liveForLabel,
    liveForNames,
} from '../../utils/serviceClassification';

type PendingChange = { record: ClassifiedOperator; planType: Classification };

const pendingTitle = (pending: PendingChange | null, tab: ServiceClassificationTab) => {
    if (!pending) return '';
    if (pending.planType) {
        return confirmMoveText(pending.record.serviceProvider, pending.planType, tab);
    }
    return confirmRemoveText(pending.record.serviceProvider, tab);
};

type Props = {
    tab: ServiceClassificationTab;
    canUpdate: boolean;
    seedSearch: string;
    refreshKey: number;
    onChanged: () => void;
};

const initialFilters = (tab: ServiceClassificationTab): ServiceClassificationFilters => ({
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: 'ASC',
    sortField: 'serviceProvider',
    classification: tab,
});

const ClassificationTabPanel = ({ tab, canUpdate, seedSearch, refreshKey, onChanged }: Props) => {
    const [filters, setFilters] = useState<ServiceClassificationFilters>(() => initialFilters(tab));
    const [pending, setPending] = useState<PendingChange | null>(null);
    const { searchText, setSearchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { rows, count, isLoading, refetch } = useServiceClassification(filters);
    const { classify, savingKey } = useClassifyService();

    useEffect(() => {
        if (!seedSearch) return;
        setSearchText(seedSearch);
        setFilters(previous => ({ ...previous, searchText: seedSearch, page: 1 }));
    }, [seedSearch, setSearchText]);

    useEffect(() => {
        if (refreshKey > 0) refetch();
    }, [refreshKey, refetch]);

    const confirmPending = async () => {
        if (!pending) return;
        const change = pending;
        setPending(null);
        const result = await classify({
            accessKey: change.record.accessKey,
            serviceProvider: change.record.serviceProvider,
            planType: change.planType,
        });
        if (result) {
            refetch();
            onChanged();
        }
    };

    const columns: GenericColumns<ClassifiedOperator> = [
        {
            title: 'Service',
            key: 'serviceProvider',
            dataIndex: 'serviceProvider',
            sorter: true,
            neverFold: true,
            width: 260,
            render: (_, record) => (
                <Flex vertical>
                    <Typography.Text className="font-medium text-textHeadings">
                        {record.serviceProvider}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-navTextColor">
                        {record.accessKey}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Category',
            key: 'serviceCategory',
            dataIndex: 'serviceCategory',
            sorter: true,
            width: 160,
            render: (_, record) => record.serviceCategory || '—',
        },
        {
            title: 'Vendor',
            key: 'vendor.vendorName',
            dataIndex: 'vendor.vendorName',
            sorter: true,
            width: 180,
            render: (_, record) => record.vendor?.vendorName || '—',
        },
        {
            title: 'Status',
            key: 'serviceStatus',
            width: 110,
            render: (_, record) => <StatusPill {...serviceActivityPill(record)} />,
        },
        {
            title: 'Live for',
            key: 'liveFor',
            width: 160,
            render: (_, record) => (
                <Tooltip
                    title={record.liveFor.length ? liveForNames(record.liveFor).join(', ') : ''}
                >
                    <Typography.Text className="text-textBody">
                        {liveForLabel(record.liveFor)}
                    </Typography.Text>
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            neverFold: true,
            width: 80,
            render: (_, record) => (
                <ClassificationRowMenu
                    record={record}
                    tab={tab}
                    canUpdate={canUpdate}
                    busy={savingKey === record.accessKey}
                    onMove={(target, planType) => setPending({ record: target, planType })}
                    onRemove={target => setPending({ record: target, planType: null })}
                />
            ),
        },
    ];

    const emptyText = filters.searchText
        ? 'No services match your search.'
        : `No ${classificationInSentence(tab, 2)} yet. Use Classify service to add some.`;

    return (
        <Flex vertical gap={16}>
            <Flex justify="end">
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search service or vendor"
                    value={searchText}
                    onChange={updateSearchText}
                    maxLength={100}
                    className="w-full sm:w-72"
                    aria-label={`Search ${classificationInSentence(tab, 2)}`}
                />
            </Flex>
            <GenericTable
                rowKey={(record: ClassifiedOperator) => record.id}
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
                locale={{ emptyText }}
            />
            <Pagination
                current={filters.page}
                pageSize={filters.itemsPerPage}
                total={count}
                onChange={handlePageChange}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />
            <ConfirmationModal
                isOpen={pending !== null}
                handleCancel={() => setPending(null)}
                title={pendingTitle(pending, tab)}
                handleSubmit={confirmPending}
                isLoading={savingKey !== null}
            />
        </Flex>
    );
};

export default ClassificationTabPanel;
