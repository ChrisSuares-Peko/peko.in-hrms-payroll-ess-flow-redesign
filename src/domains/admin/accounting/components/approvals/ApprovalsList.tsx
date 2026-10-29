import { ReactNode, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Row, Select, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { APPROVAL_KPI_CARDS, APPROVAL_STATUS_OPTIONS, approvalColumns } from './approvalColumns';
import PartnerPicker from './PartnerPicker';
import { faqHint, withFaqTitles } from '../../faq/FaqHint';
import useApprovalPartners from '../../hooks/useApprovalPartners';
import useApprovalRows from '../../hooks/useApprovalRows';
import { ApprovalGate, ApprovalRow, ApprovalStatusFilter } from '../../types/approvals';
import {
    UNGROUPED_HEADING,
    emptyTextFor,
    groupRows,
    parsePartnerId,
    parseStatusFilter,
} from '../../utils/approvals';
import KpiCard from '../dashboard/KpiCard';

export type ApprovalsListProps = {
    readOnly?: boolean;
    withFaq?: boolean;
    canDecide?: boolean;
    onReview?: (row: ApprovalRow) => void;
    onToggle?: (row: ApprovalRow, approved: boolean) => void;
    togglingKey?: string | null;
    renderGateCard: (gate: ApprovalGate | null, isLoading: boolean) => ReactNode;
    kpiTo: (partnerPermissionId: number | null, status: ApprovalStatusFilter) => string;
    intro: string;
    refreshToken?: number;
};

const rowKey = (row: ApprovalRow) => `${row.partnerPermissionId}:${row.nodeKey}`;

const ApprovalsList = ({
    readOnly = false,
    withFaq = false,
    canDecide = false,
    onReview,
    onToggle,
    togglingKey = null,
    renderGateCard,
    kpiTo,
    intro,
    refreshToken = 0,
}: ApprovalsListProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        partners,
        totals,
        gate,
        isLoading: partnersLoading,
    } = useApprovalPartners(refreshToken);
    const requestedSearch = searchParams.get('search') || '';
    const [filters, setFilters] = useState({ searchText: requestedSearch, page: 1 });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters, requestedSearch);

    const status = parseStatusFilter(searchParams.get('status'));
    const partnerId =
        parsePartnerId(searchParams.get('partner')) ?? partners[0]?.partnerPermissionId ?? null;
    const {
        rows,
        partner,
        isLoading: rowsLoading,
    } = useApprovalRows(partnerId, { status, searchText: filters.searchText }, refreshToken);
    const selected = partners.find(item => item.partnerPermissionId === partnerId) || partner;

    const setParam = (key: string, value: string | null) => {
        const next = new URLSearchParams(searchParams);
        if (value === null) next.delete(key);
        else next.set(key, value);
        setSearchParams(next);
    };

    const columns = approvalColumns({ readOnly, canDecide, onReview, onToggle, togglingKey });
    const tableColumns = withFaq ? withFaqTitles(columns, 'Approvals', 'List') : columns;
    const groups = groupRows(rows);
    const emptyText = emptyTextFor(status, filters.searchText);

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <PartnerPicker
                    partners={partners}
                    value={partnerId}
                    loading={partnersLoading}
                    onChange={value => setParam('partner', String(value))}
                />
                {totals && (
                    <Typography.Text className="text-[13px] text-textBody">
                        {`All partners: ${totals.awaiting} awaiting · ${totals.approved} approved · ${totals.rejected} rejected`}
                    </Typography.Text>
                )}
            </Flex>
            <Row gutter={[20, 20]}>
                {APPROVAL_KPI_CARDS.map(card => (
                    <Col key={card.key} xs={24} sm={12} xl={6}>
                        <KpiCard
                            title={card.title}
                            value={
                                selected
                                    ? formatNumberWithLocalString(selected.counts[card.key], 0, 0)
                                    : '—'
                            }
                            icon={card.icon}
                            tone={card.tone}
                            to={kpiTo(partnerId, card.status)}
                            help={withFaq ? faqHint('Approvals', 'KPIs', card.title) : null}
                        />
                    </Col>
                ))}
                <Col xs={24} sm={12} xl={6}>
                    {renderGateCard(gate, partnersLoading)}
                </Col>
            </Row>
            <div className="border-t border-solid border-borderCard" />
            <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                <Typography.Text className="text-[13px] text-textBody max-w-[640px]">
                    {intro}
                </Typography.Text>
                <Flex align="center" gap={12} wrap="wrap">
                    <Select
                        value={status}
                        options={APPROVAL_STATUS_OPTIONS}
                        onChange={(value: ApprovalStatusFilter) =>
                            setParam('status', value === 'awaiting' ? null : value)
                        }
                        className="w-full sm:w-48"
                        aria-label="Approval status"
                    />
                    <Input
                        allowClear
                        prefix={<SearchOutlined className="text-navTextColor" />}
                        placeholder="Search services"
                        value={searchText}
                        onChange={updateSearchText}
                        className="w-full sm:w-72"
                    />
                </Flex>
            </Flex>
            {!rowsLoading && !groups.length ? (
                <Typography.Text className="text-textBody">{emptyText}</Typography.Text>
            ) : (
                groups.map(group => (
                    <Flex vertical gap={8} key={group.group || UNGROUPED_HEADING}>
                        <Typography.Text strong className="text-textHeadings">
                            {group.group || UNGROUPED_HEADING}
                        </Typography.Text>
                        <GenericTable
                            rowKey={rowKey}
                            columns={tableColumns}
                            dataSource={group.rows}
                            loading={rowsLoading}
                            pagination={false}
                        />
                    </Flex>
                ))
            )}
            {rowsLoading && !groups.length && (
                <GenericTable
                    rowKey={rowKey}
                    columns={tableColumns}
                    dataSource={[]}
                    loading
                    pagination={false}
                />
            )}
        </Flex>
    );
};

export default ApprovalsList;
