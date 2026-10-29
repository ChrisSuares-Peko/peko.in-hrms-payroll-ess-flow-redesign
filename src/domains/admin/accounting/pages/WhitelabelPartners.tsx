import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Switch, Tooltip, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import GenericTable, { GenericColumns } from '@components/atomic/GenericTable';
import useFilter from '@src/domains/admin/settings/hooks/useFilters';
import { useGetbranding } from '@src/domains/admin/settings/hooks/useGetbranding';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import { patchPartnerShare } from '../api/catalog';
import PartnerShareDrawer, {
    PartnerShareFormValues,
} from '../components/partners/PartnerShareDrawer';
import { ACCOUNTING_SERVICE_CATEGORY } from '../config/servicePaths';
import { WhitelabelPartnerRow } from '../types/catalog';
import {
    describeGatewayCharge,
    gatewayChargeInputs,
    gatewayChargeOf,
} from '../utils/gatewayCharge';

const NO_PERMISSION = 'Sorry, you do not have permission to perform this action';

const INITIAL_FILTERS = {
    searchText: '',
    page: 1,
    itemsPerPage: 10,
    sort: 'DESC',
    sortField: 'createdAt',
};

const WhitelabelPartners = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(
        services?.data,
        'Whitelabel Partners',
        ACCOUNTING_SERVICE_CATEGORY
    );
    const canUpdate = Boolean(access?.update);

    const [searchParams] = useSearchParams();
    const requestedSearch = searchParams.get('search') || '';
    const requestedPartner = searchParams.get('configure');
    const [filters, setFilters] = useState({ ...INITIAL_FILTERS, searchText: requestedSearch });
    const [editing, setEditing] = useState<WhitelabelPartnerRow | null>(null);
    const [opened, setOpened] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters, requestedSearch);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });
    const { isLoading, tableData, count, setRefresh, updateActiveStatus } = useGetbranding(filters);
    const rows = (tableData ?? []) as unknown as WhitelabelPartnerRow[];

    useEffect(() => {
        if (!requestedPartner || !canUpdate || opened === requestedPartner) return;
        const match = (tableData as unknown as WhitelabelPartnerRow[] | undefined)?.find(
            row => String(row.registeredBy) === requestedPartner
        );
        if (!match) return;
        setEditing(match);
        setOpened(requestedPartner);
    }, [requestedPartner, canUpdate, opened, tableData]);

    const saveShare = async (values: PartnerShareFormValues) => {
        if (!editing) return;
        setSaving(true);
        const result = await patchPartnerShare({
            userId: id,
            userType: role,
            id: editing.id,
            sharePercentage: Number(values.sharePercentage),
            gatewayCharge: gatewayChargeOf(
                values.gatewayChargePercentage,
                values.gatewayChargeFixed
            ),
        });
        setSaving(false);
        if (result) {
            dispatch(
                showToast({
                    description: `Partner configuration updated for ${editing.credential?.name ?? editing.registeredBy}`,
                    variant: 'success',
                })
            );
            setEditing(null);
            setRefresh(true);
        }
    };

    const columns: GenericColumns<WhitelabelPartnerRow> = [
        {
            title: 'Partner',
            key: 'partner',
            width: 220,
            render: (_, row) => (
                <Typography.Text className="font-medium text-textHeadings">
                    {row.credential?.name ?? '—'}
                </Typography.Text>
            ),
        },
        {
            title: 'Partner ID',
            key: 'registeredBy',
            dataIndex: 'registeredBy',
            sorter: true,
            width: 140,
        },
        {
            title: 'Domain',
            key: 'domain',
            width: 220,
            render: (_, row) => row.assets?.baseUrl || '—',
        },
        {
            title: 'Share %',
            key: 'sharePercentage',
            dataIndex: 'sharePercentage',
            sorter: true,
            width: 120,
            render: value =>
                value === null || value === undefined || value === '' ? (
                    <Typography.Text className="text-amber-600">Not set</Typography.Text>
                ) : (
                    `${Number(value)}%`
                ),
        },
        {
            title: 'Gateway Charge',
            key: 'gatewayCharge',
            width: 160,
            render: (_, row) =>
                describeGatewayCharge(row.gatewayCharge) ?? (
                    <Typography.Text className="text-amber-600">Not set</Typography.Text>
                ),
        },
        {
            title: 'Status',
            key: 'brandingStatus',
            dataIndex: 'brandingStatus',
            sorter: true,
            width: 100,
            render: (status, row) => (
                <Tooltip title={canUpdate ? '' : NO_PERMISSION}>
                    <Switch
                        size="small"
                        checked={status === 1 || status === true}
                        disabled={!canUpdate}
                        onChange={checked =>
                            updateActiveStatus({ brandingId: row.id, status: checked })
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
                    <Button disabled={!canUpdate} onClick={() => setEditing(row)}>
                        Configure
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    Revenue share and gateway charge terms for whitelabel partners. The gateway
                    charge comes off Peko&apos;s earnings before the partner&apos;s share is worked
                    out.
                </Typography.Text>
                <Input
                    allowClear
                    prefix={<SearchOutlined className="text-navTextColor" />}
                    placeholder="Search partner name or ID"
                    value={searchText}
                    onChange={updateSearchText}
                    className="w-full sm:w-72"
                />
            </Flex>
            <GenericTable
                rowKey={(record: WhitelabelPartnerRow) => record.id}
                columns={columns}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
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
                <PartnerShareDrawer
                    open
                    title={`Configure ${editing.credential?.name ?? editing.registeredBy}`}
                    initialValues={{
                        sharePercentage:
                            editing.sharePercentage === null ||
                            editing.sharePercentage === undefined
                                ? ''
                                : String(Number(editing.sharePercentage)),
                        ...gatewayChargeInputs(editing.gatewayCharge),
                    }}
                    isLoading={saving}
                    onCancel={() => setEditing(null)}
                    onSubmit={values => saveShare(values)}
                />
            )}
        </Flex>
    );
};

export default WhitelabelPartners;
