import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Pagination, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import { useAppDispatch } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import {
    SERVICE_CLASSIFICATION_PATH,
    SERVICE_LEAF_BY_KIND,
    accountingServicePath,
} from '../../config/servicePaths';
import useAccountingServices from '../../hooks/useAccountingServices';
import {
    AccountingPlanType,
    AccountingService,
    AccountingServiceFilters,
} from '../../types/services';

type ServiceListPageProps = {
    kind: AccountingPlanType;
    intro: string;
    columns:
        | ColumnsType<AccountingService>
        | ((
              onToggleCommission: (record: AccountingService) => void
          ) => ColumnsType<AccountingService>);
};

const INITIAL_FILTERS: AccountingServiceFilters = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: '',
    sortField: '',
};

const ServiceListPage = ({ kind, intro, columns }: ServiceListPageProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [filters, setFilters] = useState<AccountingServiceFilters>(INITIAL_FILTERS);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { isLoading, services, count, toggleCommissionConfigured } = useAccountingServices(
        kind,
        filters
    );

    const handleToggleCommission = async (record: AccountingService) => {
        const next = !record.commissionConfigured;
        const success = await toggleCommissionConfigured(record);
        dispatch(
            showToast({
                description: success
                    ? `Commission marked as ${next ? 'configured' : 'not configured'} for ${record.serviceProvider}`
                    : 'Failed to update commission status. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
    };

    const resolvedColumns =
        typeof columns === 'function' ? columns(handleToggleCommission) : columns;

    const emptyText = useMemo(
        () =>
            filters.searchText ? (
                'No services match your search.'
            ) : (
                <span>
                    {`No services are classified as ${(SERVICE_LEAF_BY_KIND[kind].displayLabel ?? SERVICE_LEAF_BY_KIND[kind].label).toLowerCase()} yet. Classify them in `}
                    <Link to={SERVICE_CLASSIFICATION_PATH}>Service Classification</Link>.
                </span>
            ),
        [filters.searchText, kind]
    );

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {intro}
                </Typography.Text>
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search service or vendor"
                    value={searchText}
                    onChange={updateSearchText}
                    className="w-full sm:w-72"
                />
            </Flex>
            <GenericTable
                rowKey={(record: AccountingService) => record.accessKey}
                columns={resolvedColumns}
                dataSource={services}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
                locale={{ emptyText }}
                rowClassName="cursor-pointer"
                onRow={(record: AccountingService) => ({
                    onClick: () => navigate(accountingServicePath(kind, record.accessKey)),
                })}
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
        </Flex>
    );
};

export default ServiceListPage;
