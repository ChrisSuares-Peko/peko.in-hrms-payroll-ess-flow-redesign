import { useCallback, useMemo, useState } from 'react';

import { CreditCardOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, TableProps, Tag, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import DisableGatewayModal from './DisableGatewayModal';
import GlobalPaymentSettings from './GlobalPaymentSettings';
import PaymentMethodsModal from './PaymentMethodsModal';
import useGetPaymentMethods from '../../hooks/paymentMethods/useGetPaymentMethods';
import useGlobalPaymentSettings from '../../hooks/paymentMethods/useGlobalPaymentSettings';
import usePaymentMethodLookups from '../../hooks/paymentMethods/usePaymentMethodLookups';
import useUpdatePaymentMethodStatus from '../../hooks/paymentMethods/useUpdatePaymentMethodStatus';
import useFilter from '../../hooks/useFilters';
import { FilterType, PaymentMethod } from '../../types/paymentMethods';
import { toMethodFilters } from '../../utils/paymentMethods';
import getPaymentMethodColumns from '../columns/PaymentMethodColumns';

const { Title, Text } = Typography;

const INITIAL_FILTERS: FilterType = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: 'DESC',
    sortField: '',
    partnerId: '',
    pgProvider: '',
    paymentMethod: '',
    isActive: '',
};

const isInteractiveTarget = (target: EventTarget) =>
    target instanceof Element &&
    Boolean(target.closest('button, a, input, .ant-popover, .ant-table-row-expand-icon'));

type DrawerState = { record?: PaymentMethod } | null;

const PaymentMethods = () => {
    const [filters, setFilters] = useState<FilterType>(INITIAL_FILTERS);
    const { handlePageChange, handleTableChange: handleSortChange } = useFilter({ setFilters });
    const [drawer, setDrawer] = useState<DrawerState>(null);
    const [lastGatewayToDisable, setLastGatewayToDisable] = useState<PaymentMethod>();

    const lookups = usePaymentMethodLookups();
    const { globalSettings, tableData, count, isLoading, reload, refetchRowsInPlace } =
        useGetPaymentMethods(filters);
    const { settings, isDirty, isSaving, toggleSetting, discardChanges, saveChanges } =
        useGlobalPaymentSettings(globalSettings);
    const { updateStatus, updatingId } = useUpdatePaymentMethodStatus({
        onUpdated: refetchRowsInPlace,
    });

    const hasActiveFilters = Boolean(
        filters.partnerId || filters.pgProvider || filters.paymentMethod || filters.isActive
    );

    const handleTableChange: TableProps<PaymentMethod>['onChange'] = (
        pagination,
        tableFilters,
        sorter,
        extra
    ) => {
        if (extra.action !== 'filter') {
            handleSortChange?.(pagination, tableFilters, sorter, extra);
            return;
        }
        const methodValue = tableFilters.paymentMethod?.[0];
        const partnerValue = tableFilters.name?.[0];
        const statusValue = tableFilters.isActive?.[0];
        setFilters(prevState => ({
            ...prevState,
            ...toMethodFilters(methodValue === undefined ? undefined : String(methodValue)),
            partnerId:
                typeof partnerValue === 'string' || typeof partnerValue === 'number'
                    ? partnerValue
                    : '',
            isActive: statusValue === 'true' || statusValue === 'false' ? statusValue : '',
            page: 1,
        }));
    };

    const clearFilters = () => {
        setFilters(prevState => ({
            ...prevState,
            partnerId: '',
            pgProvider: '',
            paymentMethod: '',
            isActive: '',
            page: 1,
        }));
    };

    const handleStatusChange = useCallback(
        (record: PaymentMethod, isActive: boolean) => {
            if (
                !isActive &&
                record.paymentMethod === 'PAYMENT_GATEWAY' &&
                !record.hasOtherActiveGateway
            ) {
                setLastGatewayToDisable(record);
                return;
            }
            updateStatus(record.id, isActive);
        },
        [updateStatus]
    );

    const confirmDisableLastGateway = async () => {
        if (!lastGatewayToDisable) return;
        const isDisabled = await updateStatus(lastGatewayToDisable.id, false);
        if (isDisabled) setLastGatewayToDisable(undefined);
    };

    const closeDrawer = useCallback(() => setDrawer(null), []);

    const handleSaved = useCallback(() => {
        setDrawer(null);
        refetchRowsInPlace();
    }, [refetchRowsInPlace]);

    const { partnerId, pgProvider, paymentMethod, isActive } = filters;
    const columns = useMemo(
        () =>
            getPaymentMethodColumns({
                filters: { partnerId, pgProvider, paymentMethod, isActive },
                partnerOptions: lookups.partnerOptions,
                gatewayOptions: lookups.gatewayOptions,
                serviceNameById: lookups.serviceNameById,
                servicesLoading: lookups.servicesLoading,
                updatingId,
                onStatusChange: handleStatusChange,
                onEdit: record => setDrawer({ record }),
            }),
        [
            partnerId,
            pgProvider,
            paymentMethod,
            isActive,
            lookups.partnerOptions,
            lookups.gatewayOptions,
            lookups.serviceNameById,
            lookups.servicesLoading,
            updatingId,
            handleStatusChange,
        ]
    );

    const openAddDrawer = () => setDrawer({});

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="start" wrap gap={12}>
                <Flex align="center" gap={12}>
                    <Flex
                        align="center"
                        justify="center"
                        className="size-10 shrink-0 rounded-xl bg-bgIconCard"
                    >
                        <CreditCardOutlined className="text-xl text-brandColor" />
                    </Flex>
                    <Flex vertical gap={2}>
                        <Title level={4} className="!mb-0">
                            Payment Methods
                        </Title>
                        <Text className="text-sm text-textBody">
                            Control how customers pay, for everyone and for each partner.
                        </Text>
                    </Flex>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    className="w-full sm:w-auto"
                    onClick={openAddDrawer}
                >
                    Add payment method
                </Button>
            </Flex>

            <GlobalPaymentSettings
                settings={settings}
                isLoading={isLoading}
                isDirty={isDirty}
                isSaving={isSaving}
                onToggle={toggleSetting}
                onSave={saveChanges}
                onDiscard={discardChanges}
                onRetry={reload}
            />

            <Flex
                vertical
                gap={16}
                className="rounded-2xl border border-borderCard bg-white p-4 sm:p-6"
            >
                <Flex justify="space-between" align="start" wrap gap={12}>
                    <Flex vertical gap={2}>
                        <Title level={5} className="!mb-0">
                            Partner payment methods
                        </Title>
                        <Text className="text-sm text-textBody">
                            The gateway or wallet each partner&apos;s customers can use, for which
                            services and up to what amount. Click a row to edit it.
                        </Text>
                    </Flex>
                    <Flex align="center" gap={12} wrap>
                        {hasActiveFilters && (
                            <Button type="link" onClick={clearFilters} className="px-0">
                                Clear filters
                            </Button>
                        )}
                        {!isLoading && (
                            <Tag className="m-0 rounded-full border-0 bg-bgLightGray px-3 py-1 text-xs font-medium text-textGreyColor">
                                {count} {count === 1 ? 'payment method' : 'payment methods'}
                            </Tag>
                        )}
                    </Flex>
                </Flex>

                <GenericTable
                    rowKey="id"
                    columns={columns}
                    dataSource={tableData}
                    loading={isLoading}
                    onChange={handleTableChange}
                    onRow={(record: PaymentMethod) => ({
                        onClick: (event: React.MouseEvent) => {
                            if (!isInteractiveTarget(event.target)) setDrawer({ record });
                        },
                        style: { cursor: 'pointer' },
                    })}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.itemsPerPage,
                        total: count,
                        onChange: handlePageChange,
                        hideOnSinglePage: true,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    hasActiveFilters
                                        ? 'No payment methods match these filters.'
                                        : 'No payment methods yet.'
                                }
                            >
                                {hasActiveFilters ? (
                                    <Button onClick={clearFilters}>Clear filters</Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={openAddDrawer}
                                    >
                                        Add payment method
                                    </Button>
                                )}
                            </Empty>
                        ),
                    }}
                />
            </Flex>

            {drawer && (
                <PaymentMethodsModal
                    record={drawer.record}
                    lookups={lookups}
                    onClose={closeDrawer}
                    onSaved={handleSaved}
                />
            )}
            <DisableGatewayModal
                paymentMethod={lastGatewayToDisable}
                isLoading={!!lastGatewayToDisable && updatingId === lastGatewayToDisable.id}
                onConfirm={confirmDisableLastGateway}
                onCancel={() => setLastGatewayToDisable(undefined)}
            />
        </Flex>
    );
};

export default PaymentMethods;
