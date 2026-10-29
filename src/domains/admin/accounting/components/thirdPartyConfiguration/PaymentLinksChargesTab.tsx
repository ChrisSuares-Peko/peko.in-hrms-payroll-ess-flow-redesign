import { useState } from 'react';

import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Flex,
    Input,
    Pagination,
    Popconfirm,
    Select,
    Tooltip,
    Typography,
} from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import {
    DEFAULT_CHARGE_CARD_TITLE,
    THIRD_PARTY_CONFIGURATION_TAB_COPY,
    paymentLinkChargeColumns,
} from './paymentLinkChargeColumns';
import PaymentLinkChargeDrawer from './PaymentLinkChargeDrawer';
import {
    deleteCorporatePaymentLinkCharge,
    putCorporatePaymentLinkCharge,
    putDefaultPaymentLinkCharge,
} from '../../api/thirdPartyConfiguration';
import { ACCOUNTING_SERVICE_CATEGORY } from '../../config/servicePaths';
import { faqHint, withFaqTitles } from '../../faq/FaqHint';
import usePaymentLinkCharges from '../../hooks/usePaymentLinkCharges';
import {
    PaymentLinkChargeRow,
    PaymentLinkChargeScope,
    PaymentLinkChargesFilters,
} from '../../types/thirdPartyConfiguration';
import {
    ChargeFormValues,
    chargeInputs,
    chargeTermsOf,
    describeCharge,
} from '../../utils/paymentLinkCharge';
import { formatDate } from '../ledgers/vendorColumns';

export const THIRD_PARTY_CONFIGURATION_SERVICE = 'Third Party Configuration';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const SCOPE_LABEL = 'Charge source';

const SCOPE_OPTIONS: { value: PaymentLinkChargeScope; label: string }[] = [
    { value: 'all', label: 'All corporates' },
    { value: 'custom', label: 'Custom charges only' },
];

const INITIAL_FILTERS: PaymentLinkChargesFilters = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    scope: 'all',
    sort: '',
    sortField: '',
};

type Editing = { kind: 'default' } | { kind: 'corporate'; row: PaymentLinkChargeRow };

const corporateLabel = (row: PaymentLinkChargeRow) =>
    row.corporate.name ?? row.corporate.username ?? String(row.credentialId);

const PaymentLinksChargesTab = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(
        services?.data,
        THIRD_PARTY_CONFIGURATION_SERVICE,
        ACCOUNTING_SERVICE_CATEGORY
    );
    const canUpdate = Boolean(access?.update);

    const [filters, setFilters] = useState<PaymentLinkChargesFilters>(INITIAL_FILTERS);
    const [editing, setEditing] = useState<Editing | null>(null);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState<number | null>(null);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { defaultCharge, rows, count, customCount, isLoading, refetch } =
        usePaymentLinkCharges(filters);

    const copy = THIRD_PARTY_CONFIGURATION_TAB_COPY['payment-links'];

    const notify = (description: string) =>
        dispatch(showToast({ description, variant: 'success' }));

    const save = async (values: ChargeFormValues) => {
        if (!editing) return;
        setSaving(true);
        const terms = chargeTermsOf(values);
        const result =
            editing.kind === 'default'
                ? await putDefaultPaymentLinkCharge({ userId: id, userType: role, ...terms })
                : await putCorporatePaymentLinkCharge({
                      userId: id,
                      userType: role,
                      credentialId: editing.row.credentialId,
                      ...terms,
                  });
        setSaving(false);
        if (!result) return;
        notify(
            editing.kind === 'default'
                ? 'Default payment link charge saved'
                : `Custom payment link charge saved for ${corporateLabel(editing.row)}`
        );
        setEditing(null);
        refetch();
    };

    const revertToDefault = async (row: PaymentLinkChargeRow) => {
        setRemoving(row.credentialId);
        const result = await deleteCorporatePaymentLinkCharge({
            userId: id,
            userType: role,
            credentialId: row.credentialId,
        });
        setRemoving(null);
        if (!result) return;
        notify(`${corporateLabel(row)} now follows the default charge`);
        refetch();
    };

    const actions = (row: PaymentLinkChargeRow) => (
        <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
            <Flex gap={8}>
                <Button
                    size="small"
                    disabled={!canUpdate}
                    onClick={() => setEditing({ kind: 'corporate', row })}
                >
                    {row.charge ? 'Edit' : 'Set custom charge'}
                </Button>
                {row.charge ? (
                    <Popconfirm
                        title="Use the default charge?"
                        description={`${corporateLabel(row)} will follow the default charge from now on.`}
                        okText="Use default"
                        disabled={!canUpdate}
                        onConfirm={() => revertToDefault(row)}
                    >
                        <Button
                            size="small"
                            danger
                            disabled={!canUpdate}
                            loading={removing === row.credentialId}
                        >
                            Use default
                        </Button>
                    </Popconfirm>
                ) : null}
            </Flex>
        </Tooltip>
    );

    const columns = withFaqTitles(
        paymentLinkChargeColumns(actions),
        'Third Party Configuration',
        'Columns'
    );

    const emptyTextOf = () => {
        if (filters.searchText) return 'No corporates match your search.';
        if (filters.scope === 'custom') return 'No corporate has a custom charge yet.';
        return 'No corporates are onboarded for payment links yet.';
    };
    const emptyText = emptyTextOf();

    const drawerNoteOf = () => {
        if (!editing) return undefined;
        if (editing.kind === 'default') {
            return 'Applies to every corporate without a custom charge.';
        }
        return editing.row.charge
            ? undefined
            : 'Starts from the default charge; save to give this corporate its own.';
    };

    const defaultDescription = describeCharge(defaultCharge);

    const drawerInitialValues =
        editing?.kind === 'corporate'
            ? chargeInputs(editing.row.charge ?? defaultCharge)
            : chargeInputs(defaultCharge);

    return (
        <Flex vertical gap={16}>
            <Typography.Text className="text-[13px] text-textBody max-w-[720px]">
                {copy.intro}
            </Typography.Text>
            <Card
                size="small"
                title={
                    <Flex align="center" gap={6}>
                        <span>{DEFAULT_CHARGE_CARD_TITLE}</span>
                        {faqHint('Third Party Configuration', 'Cards', DEFAULT_CHARGE_CARD_TITLE)}
                    </Flex>
                }
                extra={
                    <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            disabled={!canUpdate}
                            onClick={() => setEditing({ kind: 'default' })}
                        >
                            {defaultCharge ? 'Edit default' : 'Set default'}
                        </Button>
                    </Tooltip>
                }
            >
                <Flex vertical gap={4}>
                    {defaultDescription ? (
                        <Typography.Text className="text-lg font-semibold text-textHeadings">
                            {defaultDescription}
                        </Typography.Text>
                    ) : (
                        <Typography.Text className="text-lg font-semibold text-amber-600">
                            Not set
                        </Typography.Text>
                    )}
                    <Typography.Text className="text-xs text-textBody">
                        {defaultCharge
                            ? `Last set ${formatDate(defaultCharge.updatedAt ?? '')}${
                                  defaultCharge.recordedByName
                                      ? ` by ${defaultCharge.recordedByName}`
                                      : ''
                              }. `
                            : 'Corporates without a custom charge show Not set until a default is recorded. '}
                        {customCount} of {count} listed corporates carry a custom charge.
                    </Typography.Text>
                </Flex>
            </Card>
            <Flex justify="flex-end" align="center" gap={12} wrap="wrap">
                <Select
                    value={filters.scope}
                    aria-label={SCOPE_LABEL}
                    options={SCOPE_OPTIONS}
                    onChange={value => setFilters(prev => ({ ...prev, scope: value, page: 1 }))}
                    className="w-full sm:w-52"
                />
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search corporate name or ID"
                    value={searchText}
                    onChange={updateSearchText}
                    className="w-full sm:w-72"
                />
            </Flex>
            <GenericTable
                rowKey={(record: PaymentLinkChargeRow) => record.credentialId}
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
            {editing && (
                <PaymentLinkChargeDrawer
                    open
                    title={
                        editing.kind === 'default'
                            ? 'Default payment link charge'
                            : `Payment link charge for ${corporateLabel(editing.row)}`
                    }
                    note={drawerNoteOf()}
                    initialValues={drawerInitialValues}
                    isLoading={saving}
                    onCancel={() => setEditing(null)}
                    onSubmit={save}
                />
            )}
        </Flex>
    );
};

export default PaymentLinksChargesTab;
