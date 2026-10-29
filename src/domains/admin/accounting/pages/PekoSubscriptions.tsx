import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Select, Switch, Tooltip, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import PriceAfterDiscount from '@components/atomic/PriceAfterDiscount';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import { PackageFilters, Packages } from '@src/domains/admin/settings/types/package';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

import { patchSubscriptionPricing, patchSubscriptionPricingBulk } from '../api/catalog';
import { addonRowKey, SubscriptionAddOnRow } from '../api/subscriptionAddOns';
import BulkConfigureControls from '../components/serviceDetail/BulkConfigureControls';
import AddonPricingDrawer, {
    AddonPricingFormValues,
} from '../components/subscriptions/AddonPricingDrawer';
import SubscriptionPricingDrawer, {
    SubscriptionPricingFormValues,
} from '../components/subscriptions/SubscriptionPricingDrawer';
import { ACCOUNTING_SERVICE_CATEGORY } from '../config/servicePaths';
import useBulkRowSelection from '../hooks/useBulkRowSelection';
import usePekoSubscriptionAddons from '../hooks/usePekoSubscriptionAddons';
import useSubscriptionPackages from '../hooks/useSubscriptionPackages';
import { SubscriptionPackage } from '../types/catalog';
import { formatInr } from '../utils/commission';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const PLANS_TAB = 'plans';
const ADDONS_TAB = 'addons';
const OTHERS_TAB = 'others';
const TABS = [
    { key: PLANS_TAB, label: 'Peko Subscription' },
    { key: ADDONS_TAB, label: 'Peko Subscription Add-ons' },
    { key: OTHERS_TAB, label: 'Others' },
];

const INITIAL_FILTERS: PackageFilters = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: 'DESC',
    sortField: 'createdAt',
    partnerId: '',
};

const packageCaption = (row: SubscriptionPackage) =>
    [row.serviceName, row.accessCode].filter(Boolean).join(' · ');

export const PLANS_INTRO =
    'Subscription plans sold by Peko and partners, and the packages of Peko’s own services such as Peko Commerce.';

export const ADDONS_INTRO =
    'Add-on pricing for Peko subscriptions and partners: recurring extras billed with the plan.';

export const OTHERS_INTRO =
    'Items priced per plan that a subscriber buys once, not every billing cycle. For Corporate Cards, Unit Price is the price of one extra physical card and Base Limit is how many cards the plan already includes.';

export const OTHERS_UNIT_PRICE_HINT =
    'Price of one extra unit, charged once when it is bought. For Corporate Cards, one extra physical card.';

export const OTHERS_BASE_LIMIT_HINT =
    'How many units the plan already includes at no extra charge. For Corporate Cards, the physical cards that come with the plan.';

const toAmount = (value?: string | number | null) => String(formatNumberWithoutCommas(value) || 0);

const PekoSubscriptions = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(
        services?.data,
        'Peko Subscriptions',
        ACCOUNTING_SERVICE_CATEGORY
    );
    const canUpdate = Boolean(access?.update);

    const [searchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const requestedSearch = searchParams.get('search') || '';
    const [activeTab, setActiveTab] = useState(
        TABS.some(tab => tab.key === requestedTab) ? (requestedTab as string) : PLANS_TAB
    );
    const isPlansTab = activeTab === PLANS_TAB;
    const isOthersTab = activeTab === OTHERS_TAB;

    const pickByTab = <T,>(plansValue: T, addonsValue: T, othersValue: T): T => {
        if (isPlansTab) return plansValue;
        return isOthersTab ? othersValue : addonsValue;
    };
    const pricingLabel = isOthersTab ? 'Pricing' : 'Add-on pricing';
    const rowNoun = isOthersTab ? 'plans' : 'subscriptions';

    const [filters, setFilters] = useState<PackageFilters>({
        ...INITIAL_FILTERS,
        searchText: requestedSearch,
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters, requestedSearch);
    const { handlePageChange, handleTableChange, handleChangeFilters } = useFilter({ setFilters });
    const { partnerData } = usePartnersForCorporate('');

    const plans = useSubscriptionPackages(filters);
    const addons = usePekoSubscriptionAddons(filters);
    const othersFilters = useMemo(() => ({ ...filters, kind: 'others' as const }), [filters]);
    const others = usePekoSubscriptionAddons(othersFilters);

    const [editingPlan, setEditingPlan] = useState<Packages | null>(null);
    const [editingAddon, setEditingAddon] = useState<SubscriptionAddOnRow | null>(null);
    const [saving, setSaving] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);

    const planBulk = useBulkRowSelection<SubscriptionPackage>(plans.rows, row => row.id);
    const addonBulk = useBulkRowSelection<SubscriptionAddOnRow, string>(
        addons.rows ?? [],
        addonRowKey
    );
    const othersBulk = useBulkRowSelection<SubscriptionAddOnRow, string>(
        others.rows ?? [],
        addonRowKey
    );
    // planBulk's selection is typed for Packages/number ids, addonBulk's for
    // SubscriptionAddOnRow/string ids — pickByTab's single type param can't unify them, but every
    // caller below only touches fields common to both (selectionMode/selectedRows/start/reset).
    const activeAddonList = isOthersTab ? others : addons;
    const activeAddonBulk = isOthersTab ? othersBulk : addonBulk;
    const bulkSelection = isPlansTab ? planBulk : activeAddonBulk;
    const activeRows = isPlansTab ? plans.rows : activeAddonList.rows;

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setFilters(prev => ({ ...prev, page: 1 }));
        planBulk.reset();
        addonBulk.reset();
        othersBulk.reset();
    };

    const savePlanPricing = async (values: SubscriptionPricingFormValues) => {
        if (!editingPlan) return;
        setSaving(true);
        const result = await patchSubscriptionPricing({
            userId: id,
            userType: role,
            id: editingPlan.id,
            packagePrices: {
                monthly: Number(values.packagePrices.monthly) || 0,
                annually: Number(values.packagePrices.annually) || 0,
            },
            discount: {
                monthly: Number(values.discount.monthly) || 0,
                annually: Number(values.discount.annually) || 0,
            },
        });
        setSaving(false);
        if (result) {
            dispatch(
                showToast({
                    description: `Pricing updated for ${editingPlan.packageName}`,
                    variant: 'success',
                })
            );
            setEditingPlan(null);
            plans.handleRefresh();
        }
    };

    const saveBulkPlanPricing = async (values: SubscriptionPricingFormValues) => {
        const ids = planBulk.selectedIds;
        const result = await patchSubscriptionPricingBulk({
            userId: id,
            userType: role,
            ids,
            packagePrices: {
                monthly: Number(values.packagePrices.monthly) || 0,
                annually: Number(values.packagePrices.annually) || 0,
            },
            discount: {
                monthly: Number(values.discount.monthly) || 0,
                annually: Number(values.discount.annually) || 0,
            },
        });
        dispatch(
            showToast({
                description: result
                    ? `Pricing applied to ${ids.length} selected subscriptions`
                    : 'Failed to save pricing. Please try again.',
                variant: result ? 'success' : 'error',
            })
        );
        if (result) {
            setBulkOpen(false);
            planBulk.reset();
            plans.handleRefresh();
        }
    };

    const saveAddonPricing = async (values: AddonPricingFormValues) => {
        if (!editingAddon) return;
        setSaving(true);
        const result = await activeAddonList.saveRow(editingAddon, {
            unitPrice: values.unitPrice,
            baseLimit: values.baseLimit,
        });
        setSaving(false);
        dispatch(
            showToast({
                description: result
                    ? `${pricingLabel} updated for ${editingAddon.packageName || (isOthersTab ? 'the plan' : 'the subscription')}`
                    : `Failed to save ${pricingLabel.toLowerCase()}. Please try again.`,
                variant: result ? 'success' : 'error',
            })
        );
        if (result) setEditingAddon(null);
    };

    const saveBulkAddonPricing = async (values: AddonPricingFormValues) => {
        const selected = activeAddonBulk.selectedRows;
        const result = await activeAddonList.bulkSaveRows(selected, {
            unitPrice: values.unitPrice,
            baseLimit: values.baseLimit,
        });
        dispatch(
            showToast({
                description: result
                    ? `${pricingLabel} applied to ${selected.length} selected ${rowNoun}`
                    : `Failed to save ${pricingLabel.toLowerCase()}. Please try again.`,
                variant: result ? 'success' : 'error',
            })
        );
        if (result) {
            setBulkOpen(false);
            activeAddonBulk.reset();
        }
    };

    const planColumns: GenericColumns<SubscriptionPackage> = [
        {
            title: 'Subscription',
            key: 'packageName',
            dataIndex: 'packageName',
            sorter: true,
            width: 200,
            render: (_, row) => (
                <Flex vertical>
                    <Typography.Text className="font-medium text-textHeadings">
                        {row.packageName}
                    </Typography.Text>
                    {packageCaption(row) && (
                        <Typography.Text className="text-xs text-navTextColor">
                            {packageCaption(row)}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Partner',
            key: 'partnerName',
            dataIndex: 'partnerName',
            sorter: true,
            width: 140,
            render: value => value || 'Default',
        },
        {
            title: 'Monthly',
            key: 'monthly',
            width: 110,
            render: (_, row) => (
                <PriceAfterDiscount
                    price={row.packagePrices?.monthly}
                    discount={row.discount?.monthly}
                    format={formatInr}
                />
            ),
        },
        {
            title: 'Annual',
            key: 'annually',
            width: 110,
            render: (_, row) => (
                <PriceAfterDiscount
                    price={row.packagePrices?.annually}
                    discount={row.discount?.annually}
                    format={formatInr}
                />
            ),
        },
        {
            title: 'Discounts',
            key: 'discount',
            width: 200,
            render: (_, row) =>
                `${formatInr(Number(formatNumberWithoutCommas(row.discount?.monthly)) || 0)} / mo · ${formatInr(Number(formatNumberWithoutCommas(row.discount?.annually)) || 0)} / yr`,
        },
        {
            title: 'Status',
            key: 'status',
            dataIndex: 'status',
            sorter: true,
            width: 90,
            render: (status, row) => (
                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                    <Switch
                        size="small"
                        checked={status === 1 || status === true}
                        disabled={!canUpdate}
                        onChange={checked =>
                            plans.updateActiveStatus({ packageId: row.id, status: checked })
                        }
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 130,
            neverFold: true,
            render: (_, row) => (
                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                    <Button disabled={!canUpdate} onClick={() => setEditingPlan(row)}>
                        Configure
                    </Button>
                </Tooltip>
            ),
        },
    ];

    const addonColumns: GenericColumns<SubscriptionAddOnRow> = [
        {
            title: 'Service Operator',
            key: 'serviceProvider',
            dataIndex: 'serviceProvider',
            width: 200,
            render: (_, row) => (
                <Flex vertical>
                    <Typography.Text className="font-medium text-textHeadings">
                        {row.serviceProvider || '—'}
                    </Typography.Text>
                    {row.accessKey && (
                        <Typography.Text className="text-xs text-navTextColor">
                            {row.accessKey}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: 'Package Name',
            key: 'packageName',
            dataIndex: 'packageName',
            width: 160,
            render: value => value || '—',
        },
        {
            title: 'Partner',
            key: 'partnerName',
            dataIndex: 'partnerName',
            width: 140,
            render: value => value || 'Default',
        },
        {
            title: 'Unit Price',
            key: 'unitPrice',
            width: 130,
            render: (_, row) => `₹ ${formatNumberWithLocalString(row.unitPrice) ?? '0.00'}`,
        },
        {
            title: 'Base Limit',
            key: 'baseLimit',
            width: 130,
            render: (_, row) => formatNumberWithLocalString(row.baseLimit) ?? '0',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 130,
            neverFold: true,
            render: (_, row) => (
                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                    <Button disabled={!canUpdate} onClick={() => setEditingAddon(row)}>
                        Configure
                    </Button>
                </Tooltip>
            ),
        },
    ];

    const activeTable = pickByTab(
        <GenericTable
            key="plans-table"
            rowKey={(record: Packages) => record.id}
            columns={planColumns}
            dataSource={plans.rows}
            loading={plans.isLoading}
            pagination={false}
            onChange={handleTableChange}
            rowSelection={planBulk.rowSelection}
        />,
        <GenericTable
            key="addons-table"
            rowKey={addonRowKey}
            columns={addonColumns}
            dataSource={addons.rows}
            loading={addons.isLoading}
            pagination={false}
            onChange={handleTableChange}
            rowSelection={addonBulk.rowSelection}
        />,
        <GenericTable
            key="others-table"
            rowKey={addonRowKey}
            columns={addonColumns}
            dataSource={others.rows}
            loading={others.isLoading}
            pagination={false}
            onChange={handleTableChange}
            rowSelection={othersBulk.rowSelection}
        />
    );

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {pickByTab(PLANS_INTRO, ADDONS_INTRO, OTHERS_INTRO)}
                </Typography.Text>
                <Flex gap={12} wrap="wrap">
                    <Select
                        allowClear
                        placeholder="All partners"
                        options={partnerData}
                        onChange={value => handleChangeFilters(value ?? '')}
                        className="w-full sm:w-48"
                    />
                    <Input
                        allowClear
                        prefix={<SearchOutlined className="text-navTextColor" />}
                        placeholder="Search subscription"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                    <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                        <BulkConfigureControls
                            selectionMode={bulkSelection.selectionMode}
                            selectedCount={bulkSelection.selectedRows.length}
                            disabled={!canUpdate || !activeRows?.length}
                            onStart={bulkSelection.start}
                            onCancel={bulkSelection.reset}
                            onConfigure={() => setBulkOpen(true)}
                        />
                    </Tooltip>
                </Flex>
            </Flex>

            <PageTabs tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

            {activeTable}
            <Pagination
                current={filters.page}
                pageSize={filters.itemsPerPage}
                total={pickByTab(plans.count, addons.count, others.count)}
                onChange={handlePageChange}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />

            {editingPlan && (
                <SubscriptionPricingDrawer
                    open
                    title={`Configure ${editingPlan.packageName}`}
                    initialValues={{
                        packagePrices: {
                            monthly: toAmount(editingPlan.packagePrices?.monthly),
                            annually: toAmount(editingPlan.packagePrices?.annually),
                        },
                        discount: {
                            monthly: toAmount(editingPlan.discount?.monthly),
                            annually: toAmount(editingPlan.discount?.annually),
                        },
                    }}
                    isLoading={saving}
                    onCancel={() => setEditingPlan(null)}
                    onSubmit={savePlanPricing}
                />
            )}
            {bulkOpen && isPlansTab && (
                <SubscriptionPricingDrawer
                    open
                    title={`Bulk configure — ${planBulk.selectedRows.length} subscriptions`}
                    initialValues={{
                        packagePrices: { monthly: '', annually: '' },
                        discount: { monthly: '', annually: '' },
                    }}
                    onCancel={() => setBulkOpen(false)}
                    onSubmit={saveBulkPlanPricing}
                />
            )}

            {editingAddon && (
                <AddonPricingDrawer
                    open
                    title={`Configure ${editingAddon.packageName || (isOthersTab ? 'item' : 'add-on')}`}
                    initialValues={{
                        unitPrice: toAmount(editingAddon.unitPrice),
                        baseLimit: toAmount(editingAddon.baseLimit),
                    }}
                    isLoading={saving}
                    onCancel={() => setEditingAddon(null)}
                    onSubmit={saveAddonPricing}
                    unitPriceHint={isOthersTab ? OTHERS_UNIT_PRICE_HINT : undefined}
                    baseLimitHint={isOthersTab ? OTHERS_BASE_LIMIT_HINT : undefined}
                />
            )}
            {bulkOpen && !isPlansTab && (
                <AddonPricingDrawer
                    open
                    title={`Bulk configure — ${activeAddonBulk.selectedRows.length} ${rowNoun}`}
                    initialValues={{ unitPrice: '', baseLimit: '' }}
                    onCancel={() => setBulkOpen(false)}
                    onSubmit={saveBulkAddonPricing}
                    unitPriceHint={isOthersTab ? OTHERS_UNIT_PRICE_HINT : undefined}
                    baseLimitHint={isOthersTab ? OTHERS_BASE_LIMIT_HINT : undefined}
                />
            )}
        </Flex>
    );
};

export default PekoSubscriptions;
