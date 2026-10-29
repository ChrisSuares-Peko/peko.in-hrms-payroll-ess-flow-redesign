import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';
import { useAppDispatch } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import AddOnsTab from './AddOnsTab';
import BulkConfigureControls from './BulkConfigureControls';
import CommissionTab, { CommissionTabProps } from './CommissionTab';
import ConfigureCommissionDrawer, {
    CommissionBlockValues,
    CommissionFormValues,
} from './ConfigureCommissionDrawer';
import {
    NotConfigured,
    PlanPrice,
    commissionLabel,
    commissionModeLabel,
    gstCell,
    toFormValues,
} from './planCells';
import TabHeader from './TabHeader';
import useAccountingServicePlans from '../../hooks/useAccountingServicePlans';
import useBulkRowSelection from '../../hooks/useBulkRowSelection';
import { AccountingService, CommissionBlock, ServicePlan } from '../../types/services';
import { formatInr } from '../../utils/commission';
import { getPlanTabConfig } from '../../utils/serviceDetailData';
import ConfiguredIcon from '../common/ConfiguredIcon';

const INITIAL_FILTERS = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: '',
    sortField: '',
    partnerId: '',
};

const priceLabel = (plan: ServicePlan) => {
    if (plan.minPrice != null || plan.maxPrice != null) {
        return `${formatInr(Number(plan.minPrice) || 0)} - ${formatInr(Number(plan.maxPrice) || 0)}`;
    }
    if (plan.monthlyPrice != null) return formatInr(Number(plan.monthlyPrice));
    return '—';
};

const PLANS_SUB_TAB = 'plans';
const DOMAIN_SUB_TAB = 'domain';
const ADDONS_SUB_TAB = 'addOns';

type PlansTabProps = {
    service: AccountingService;
    onSaveCommission: CommissionTabProps['onSave'];
    onToggleCommissionConfigured: CommissionTabProps['onToggleConfigured'];
    onConfigurationChange?: () => void;
};

const PlansTab = ({
    service,
    onSaveCommission,
    onToggleCommissionConfigured,
    onConfigurationChange,
}: PlansTabProps) => {
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const requestedSearch = searchParams.get('search') || '';
    const [filters, setFilters] = useState({ ...INITIAL_FILTERS, searchText: requestedSearch });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters, requestedSearch);
    const { handlePageChange, handleTableChange, handleChangeFilters } = useFilter({ setFilters });
    const tabConfig = getPlanTabConfig(service.accessKey);
    const { partnerData } = usePartnersForCorporate('');
    const {
        isLoading,
        supported,
        plans,
        count,
        updatePlanCommission,
        updatePlanCommissionBulk,
        togglePlanCommissionConfigured,
    } = useAccountingServicePlans(service.accessKey, filters);
    const [editing, setEditing] = useState<ServicePlan | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const bulkSelection = useBulkRowSelection<ServicePlan>(plans, plan => plan.id);
    const [subTab, setSubTab] = useState(
        tabConfig.hasAddOnsTab && searchParams.get('subTab') === ADDONS_SUB_TAB
            ? ADDONS_SUB_TAB
            : PLANS_SUB_TAB
    );

    const toBlockPayload = (block: CommissionBlockValues): CommissionBlock => ({
        commissionMode: block.commissionMode,
        commissionType: block.commissionType,
        commission: Number(block.providerCommission) || 0,
        fixedCommissionPerTransaction: Number(block.fixedCommissionPerTransaction) || 0,
        isCommissionInclGST: block.isCommissionInclGST,
    });

    // In split mode the flat fields mirror the monthly block (still required by the backend).
    const toPayload = (values: CommissionFormValues) => {
        if (values.useSplitCommission && values.monthly && values.annually) {
            const monthly = toBlockPayload(values.monthly);
            const annually = toBlockPayload(values.annually);
            return {
                commissionMode: monthly.commissionMode,
                commissionType: monthly.commissionType,
                providerCommission: monthly.commission,
                fixedCommissionPerTransaction: monthly.fixedCommissionPerTransaction,
                isCommissionInclGST: monthly.isCommissionInclGST,
                splitCommission: { monthly, annually },
            };
        }
        return {
            commissionMode: values.commissionMode,
            commissionType: values.commissionType,
            providerCommission: Number(values.providerCommission) || 0,
            fixedCommissionPerTransaction: Number(values.fixedCommissionPerTransaction) || 0,
            isCommissionInclGST: values.isCommissionInclGST,
            splitCommission: null,
        };
    };

    const handleToggleCommissionConfigured = async (plan: ServicePlan) => {
        const next = !plan.commissionConfigured;
        const success = await togglePlanCommissionConfigured(plan);
        dispatch(
            showToast({
                description: success
                    ? `Commission marked as ${next ? 'configured' : 'not configured'} for ${plan.planName}`
                    : 'Failed to update commission status. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) onConfigurationChange?.();
    };

    const saveCommission = async (planId: number, values: CommissionFormValues) => {
        const success = await updatePlanCommission(planId, {
            ...toPayload(values),
            ...(tabConfig.priceField === 'editable' && {
                price: Number(values.price),
                ...(tabConfig.hasAnnualPrice && { annualPrice: Number(values.annualPrice) }),
                ...(tabConfig.hasDiscount && {
                    discount: Number(values.discount),
                    annualDiscount: Number(values.annualDiscount),
                }),
            }),
        });
        dispatch(
            showToast({
                description: success
                    ? 'Commission saved'
                    : 'Failed to save commission. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) {
            setEditing(null);
            onConfigurationChange?.();
        }
    };

    const saveCommissionBulk = async (planIds: number[], values: CommissionFormValues) => {
        const success = await updatePlanCommissionBulk(planIds, toPayload(values));
        dispatch(
            showToast({
                description: success
                    ? `Commission applied to ${planIds.length} selected plans`
                    : 'Failed to save commission. Please try again.',
                variant: success ? 'success' : 'error',
            })
        );
        if (success) {
            setBulkOpen(false);
            bulkSelection.reset();
            onConfigurationChange?.();
        }
    };

    const buildExtraColumn = (
        col: (typeof tabConfig.extraColumns)[number]
    ): ColumnsType<ServicePlan>[number] => ({
        title: col.label,
        key: col.key,
        dataIndex: col.key,
        sorter: col.key === 'partnerName' ? true : undefined,
        render: (_, plan) => {
            const value = plan[col.key];
            if (value == null || value === '') return '—';
            const markup = plan.priceMarkup?.[col.key as 'annualPrice' | 'vendorPrice'];
            if (col.key === 'annualPrice' || col.key === 'vendorPrice') {
                return (
                    <PlanPrice
                        price={value as number | string}
                        markup={markup}
                        discount={
                            tabConfig.hasDiscount && col.key === 'annualPrice'
                                ? plan.annualDiscount
                                : undefined
                        }
                    />
                );
            }
            return col.label.toLowerCase().includes('price')
                ? formatInr(Number(value) || 0)
                : String(value);
        },
    });

    const extraColumns: ColumnsType<ServicePlan> = tabConfig.extraColumns.map(buildExtraColumn);
    const priceExtraColumns: ColumnsType<ServicePlan> = (tabConfig.priceExtraColumns ?? []).map(
        buildExtraColumn
    );

    const columns: GenericColumns<ServicePlan> = [
        {
            title: 'Plan Name',
            dataIndex: 'planName',
            key: 'planName',
            width: 280,
            sorter: true,
            render: value => <Typography.Text className="font-medium">{value}</Typography.Text>,
        },
        ...extraColumns,
        ...(tabConfig.hidePriceColumn
            ? []
            : [
                  {
                      title: tabConfig.priceColumnLabel ?? 'Price',
                      key: 'price',
                      render: (_: unknown, plan: ServicePlan) =>
                          plan.monthlyPrice != null &&
                          plan.minPrice == null &&
                          plan.maxPrice == null ? (
                              <PlanPrice
                                  price={plan.monthlyPrice}
                                  markup={plan.priceMarkup?.monthlyPrice}
                                  discount={
                                      tabConfig.hasDiscount ? plan.monthlyDiscount : undefined
                                  }
                              />
                          ) : (
                              priceLabel(plan)
                          ),
                  },
                  ...priceExtraColumns,
              ]),
        {
            title: 'Commission Mode',
            key: 'commissionMode',
            render: (_, plan) => commissionModeLabel(plan) ?? <NotConfigured />,
        },
        {
            title: 'Commission',
            key: 'commission',
            render: (_, plan) => commissionLabel(plan) ?? <NotConfigured />,
        },
        {
            title: 'GST',
            key: 'gst',
            render: (_, plan) => gstCell(plan),
        },
        {
            title: 'Commission Configured',
            key: 'commissionConfigured',
            align: 'center',
            render: (_, plan) => (
                <ConfiguredIcon
                    configured={plan.commissionConfigured}
                    onToggle={() => handleToggleCommissionConfigured(plan)}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            neverFold: true,
            render: (_, plan) => <Button onClick={() => setEditing(plan)}>Configure</Button>,
        },
    ];

    if (!isLoading && !supported) {
        return (
            <CommissionTab
                service={service}
                onSave={onSaveCommission}
                onToggleConfigured={onToggleCommissionConfigured}
            />
        );
    }

    const plansContent = (
        <>
            <TabHeader
                title="Plans"
                description={`Configure the commission Peko earns on each plan of ${service.serviceProvider}.`}
                action={
                    <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto md:items-center">
                        {tabConfig.hasPartnerFilter && (
                            <Select
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                placeholder="Select Partner"
                                className="min-w-52"
                                options={partnerData?.map(p => ({ ...p, value: String(p.value) }))}
                                onChange={value => handleChangeFilters(value)}
                            />
                        )}
                        <Input
                            allowClear
                            suffix={<SearchOutlined />}
                            placeholder="Search"
                            value={searchText}
                            onChange={updateSearchText}
                        />
                        <BulkConfigureControls
                            selectionMode={bulkSelection.selectionMode}
                            selectedCount={bulkSelection.selectedIds.length}
                            disabled={!plans.length}
                            onStart={bulkSelection.start}
                            onCancel={bulkSelection.reset}
                            onConfigure={() => setBulkOpen(true)}
                        />
                    </Flex>
                }
            />
            <GenericTable
                rowKey="id"
                columns={columns}
                dataSource={plans}
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
                <ConfigureCommissionDrawer
                    open
                    serviceKey={service.accessKey}
                    title={`Configure commission — ${editing.planName}`}
                    initialValues={toFormValues(editing)}
                    supportsSplitCommission={tabConfig.supportsSplitCommission}
                    priceField={tabConfig.priceField}
                    priceLabel={tabConfig.priceColumnLabel}
                    hasAnnualPrice={tabConfig.hasAnnualPrice}
                    hasDiscount={tabConfig.hasDiscount}
                    onCancel={() => setEditing(null)}
                    onSubmit={values => saveCommission(editing.id, values)}
                />
            )}
            {bulkOpen && (
                <ConfigureCommissionDrawer
                    open
                    serviceKey={service.accessKey}
                    title={`Bulk configure — ${bulkSelection.selectedIds.length} plans`}
                    initialValues={toFormValues(null)}
                    supportsSplitCommission={tabConfig.supportsSplitCommission}
                    onCancel={() => setBulkOpen(false)}
                    onSubmit={values => saveCommissionBulk(bulkSelection.selectedIds, values)}
                />
            )}
        </>
    );

    const subTabs = [
        { key: PLANS_SUB_TAB, label: 'Plans' },
        ...(tabConfig.hasDomainCommissionTab ? [{ key: DOMAIN_SUB_TAB, label: 'Domain' }] : []),
        ...(tabConfig.hasAddOnsTab ? [{ key: ADDONS_SUB_TAB, label: 'Add-ons' }] : []),
    ];

    if (subTabs.length === 1) {
        return <div>{plansContent}</div>;
    }

    return (
        <div>
            <PageTabs tabs={subTabs} activeKey={subTab} onChange={setSubTab} />
            <div className="mt-4">
                {subTab === PLANS_SUB_TAB && plansContent}
                {subTab === DOMAIN_SUB_TAB && (
                    <CommissionTab
                        service={service}
                        onSave={onSaveCommission}
                        onToggleConfigured={onToggleCommissionConfigured}
                    />
                )}
                {subTab === ADDONS_SUB_TAB && (
                    <AddOnsTab service={service} onConfigurationChange={onConfigurationChange} />
                )}
            </div>
        </div>
    );
};

export default PlansTab;
