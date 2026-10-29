import { useMemo, useState } from 'react';

import { Button, DatePicker, Flex, Pagination, Tag, TableProps, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import ExportButtons from '../components/common/ExportButtons';
import LedgerFilterBar from '../components/common/LedgerFilterBar';
import RecordedByCell from '../components/common/RecordedByCell';
import { useAuditTrail } from '../hooks/useAuditTrail';
import useAuditTrailExport from '../hooks/useAuditTrailExport';
import { AuditEntry, AuditSource, AuditTrailFilters } from '../types/auditTrail';
import {
    ACTION_LABELS,
    CONFIG_TYPE_LABELS,
    CONFIG_TYPE_OPTIONS,
    DEFAULT_PARTNER,
    EMPTY_VALUE,
    SOURCE_LABELS,
    SOURCE_OPTIONS,
    describeChange,
} from '../utils/auditTrail';

const PAGE_SIZE = 10;

const DATE_FORMAT = 'YYYY-MM-DD';

const SORT_OF_ORDER = { ascend: 'ASC', descend: 'DESC' } as const;

const AUDIT_TRAIL_INTRO =
    'Every change to a commission, platform fee, cashback, subscription price or partner share: who made it, what it was before and after, and whether it was made in the Accounting Portal or the Admin Panel.';

// Up to three changes show in full; a longer list starts with two and opens a few more at a time.
const INITIAL_CHANGES = 2;
const CHANGES_PER_STEP = 3;

const ChangeLines = ({ entry }: { entry: AuditEntry }) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_CHANGES);
    const total = entry.changes.length;
    const isLong = total > INITIAL_CHANGES + 1;
    const hasMore = visibleCount < total;
    const shown = isLong ? entry.changes.slice(0, visibleCount) : entry.changes;

    return (
        <Flex vertical gap={2} align="flex-start">
            {shown.map(change => (
                <Typography.Text key={change.field} className="text-[13px]">
                    {describeChange(change, entry.action)}
                </Typography.Text>
            ))}
            {isLong && (
                <Button
                    type="link"
                    size="small"
                    className="h-auto px-0 text-xs"
                    onClick={() =>
                        setVisibleCount(
                            hasMore
                                ? Math.min(visibleCount + CHANGES_PER_STEP, total)
                                : INITIAL_CHANGES
                        )
                    }
                >
                    {hasMore ? 'Show more' : 'Show less'}
                </Button>
            )}
        </Flex>
    );
};

const auditTrailColumns: ColumnsType<AuditEntry> = [
    {
        title: 'When',
        key: 'createdAt',
        dataIndex: 'createdAt',
        sorter: true,
        defaultSortOrder: 'descend',
        width: 170,
        render: (_, row) => dayjs(row.createdAt).format('DD MMM YYYY, hh:mm A'),
    },
    {
        title: 'Who',
        key: 'actorName',
        dataIndex: 'actorName',
        sorter: true,
        width: 160,
        render: (_, row) => <RecordedByCell name={row.actorName} ipAddress={row.ipAddress} />,
    },
    {
        title: 'Changed from',
        key: 'source',
        width: 170,
        render: (_, row) => (
            <Tag color={row.source === 'ACCOUNTING_PORTAL' ? 'blue' : 'default'}>
                {SOURCE_LABELS[row.source]}
            </Tag>
        ),
    },
    {
        title: 'Configuration',
        key: 'configType',
        dataIndex: 'configType',
        sorter: true,
        width: 190,
        render: (_, row) => (
            <Flex vertical gap={4} align="flex-start">
                <Typography.Text>
                    {CONFIG_TYPE_LABELS[row.configType] || row.configType}
                </Typography.Text>
                {row.action !== 'UPDATE' && (
                    <Tag color={row.action === 'CREATE' ? 'green' : 'red'}>
                        {ACTION_LABELS[row.action]}
                    </Tag>
                )}
            </Flex>
        ),
    },
    { title: 'For', key: 'target', width: 240, render: (_, row) => row.targetLabel || EMPTY_VALUE },
    {
        title: 'Partner',
        key: 'partnerName',
        dataIndex: 'partnerName',
        sorter: true,
        width: 160,
        render: (_, row) => row.partnerName || EMPTY_VALUE,
    },
    {
        title: 'What changed',
        key: 'changes',
        width: 380,
        render: (_, row) => <ChangeLines entry={row} />,
    },
];

const AuditTrail = () => {
    const [query, setQuery] = useState<{
        page: number;
        searchText: string;
        sort?: 'ASC' | 'DESC';
        sortField?: string;
    }>({ page: 1, searchText: '' });
    const [configType, setConfigType] = useState<string | undefined>();
    const [source, setSource] = useState<AuditSource | undefined>();
    const [partnerName, setPartnerName] = useState<string | undefined>();
    const [range, setRange] = useState<{ from: string; to: string } | null>(() => ({
        from: dayjs().subtract(1, 'month').format(DATE_FORMAT),
        to: dayjs().format(DATE_FORMAT),
    }));

    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const { partnerData } = usePartnersForCorporate('');

    // The history stores the partner's name, and the shared list calls the default partner Default.
    const partnerOptions = useMemo(
        () =>
            (partnerData || []).map(option => {
                const name = option.value === 'default' ? DEFAULT_PARTNER : option.label;
                return { value: name, label: name };
            }),
        [partnerData]
    );

    const filters = useMemo<AuditTrailFilters>(
        () => ({
            page: query.page,
            itemsPerPage: PAGE_SIZE,
            searchText: query.searchText,
            configType,
            source,
            partnerName,
            sort: query.sort,
            sortField: query.sortField,
            from: range?.from,
            to: range?.to,
        }),
        [
            query.page,
            query.searchText,
            query.sort,
            query.sortField,
            configType,
            source,
            partnerName,
            range,
        ]
    );

    const { entries, count, isLoading } = useAuditTrail(filters);

    const exportFilters = useMemo(
        () => ({
            searchText: query.searchText,
            configType,
            source,
            partnerName,
            sort: query.sort,
            sortField: query.sortField,
            from: range?.from,
            to: range?.to,
        }),
        [query.searchText, query.sort, query.sortField, configType, source, partnerName, range]
    );
    const { exportingFormat, exportAs } = useAuditTrailExport(exportFilters);

    const setPage = (page: number) => setQuery(prev => ({ ...prev, page }));

    const handleTableChange: TableProps<AuditEntry>['onChange'] = (_, __, sorter) => {
        const { field, order } = Array.isArray(sorter) ? sorter[0] || {} : sorter;
        const isSorted = Boolean(order && field);
        setQuery(prev => ({
            ...prev,
            page: 1,
            sortField: isSorted ? String(field) : undefined,
            sort: order && isSorted ? SORT_OF_ORDER[order] : undefined,
        }));
    };

    const resetToFirstPage = () => setQuery(prev => ({ ...prev, page: 1 }));

    const hasFilter = Boolean(query.searchText || configType || source || partnerName);
    const emptyText = hasFilter
        ? 'No changes match your search or filter.'
        : `No configuration changes have been recorded ${range ? 'in this period' : 'yet'}.`;

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {AUDIT_TRAIL_INTRO}
                </Typography.Text>
                <DatePicker.RangePicker
                    allowClear
                    format={DATE_FORMAT}
                    value={range ? [dayjs(range.from), dayjs(range.to)] : null}
                    onChange={values => {
                        setRange(
                            values && values[0] && values[1]
                                ? {
                                      from: values[0].format(DATE_FORMAT),
                                      to: values[1].format(DATE_FORMAT),
                                  }
                                : null
                        );
                        resetToFirstPage();
                    }}
                />
            </Flex>
            <LedgerFilterBar
                note={
                    <ExportButtons
                        onExport={exportAs}
                        loadingFormat={exportingFormat}
                        disabled={isLoading || count === 0}
                    />
                }
                selects={[
                    {
                        key: 'configType',
                        label: 'Configuration',
                        placeholder: 'All configurations',
                        options: CONFIG_TYPE_OPTIONS,
                        className: 'w-full sm:w-52',
                        value: configType,
                        onChange: value => {
                            setConfigType(value);
                            resetToFirstPage();
                        },
                    },
                    {
                        key: 'partner',
                        label: 'Partner',
                        placeholder: 'All partners',
                        options: partnerOptions,
                        className: 'w-full sm:w-48',
                        value: partnerName,
                        onChange: value => {
                            setPartnerName(value);
                            resetToFirstPage();
                        },
                    },
                    {
                        key: 'source',
                        label: 'Changed from',
                        placeholder: 'All sources',
                        options: SOURCE_OPTIONS,
                        className: 'w-full sm:w-48',
                        value: source,
                        onChange: value => {
                            setSource(value as AuditSource | undefined);
                            resetToFirstPage();
                        },
                    },
                ]}
                search={{
                    value: searchText,
                    placeholder: 'Search a person or a service',
                    onChange: updateSearchText,
                }}
            />
            <GenericTable
                rowKey={(record: AuditEntry) => record.id}
                columns={auditTrailColumns}
                dataSource={entries}
                loading={isLoading}
                pagination={false}
                onChange={handleTableChange}
                locale={{ emptyText }}
            />
            <Pagination
                current={query.page}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={setPage}
                showSizeChanger={false}
                hideOnSinglePage
                className="text-end justify-end"
            />
        </Flex>
    );
};

export default AuditTrail;
