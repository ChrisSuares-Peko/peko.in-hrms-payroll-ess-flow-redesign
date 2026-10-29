import { ReactNode } from 'react';

import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { GenericColumns } from '@components/atomic/GenericTable';

import ApprovalSwitch from './ApprovalSwitch';
import DriftTag from './DriftTag';
import EvidenceCell from './EvidenceCell';
import ReadinessCell from './ReadinessCell';
import { ApprovalCounts, ApprovalRow, ApprovalStatusFilter } from '../../types/approvals';
import { approvalStatusPill, switchedOnPill } from '../../utils/approvals';
import { KpiTone } from '../../utils/dashboardData';
import StatusPill from '../common/StatusPill';

export type ApprovalKpiCard = {
    key: keyof Pick<ApprovalCounts, 'awaiting' | 'approved' | 'rejected'>;
    title: string;
    icon: ReactNode;
    tone?: KpiTone;
    status: ApprovalStatusFilter;
};

export const APPROVAL_KPI_CARDS: ApprovalKpiCard[] = [
    {
        key: 'awaiting',
        title: 'Awaiting Approval',
        icon: <ClockCircleOutlined />,
        tone: 'warning',
        status: 'awaiting',
    },
    { key: 'approved', title: 'Approved', icon: <CheckCircleOutlined />, status: 'approved' },
    {
        key: 'rejected',
        title: 'Rejected',
        icon: <CloseCircleOutlined />,
        tone: 'danger',
        status: 'rejected',
    },
];

export const APPROVAL_GATE_CARD_TITLE = 'Approval Gate';

export const APPROVAL_STATUS_OPTIONS: { value: ApprovalStatusFilter; label: string }[] = [
    { value: 'awaiting', label: 'Awaiting approval' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
];

const decidedLine = (row: ApprovalRow) =>
    row.decidedAt
        ? `by ${row.decidedByName || 'system'} · ${dayjs(row.decidedAt).format('DD MMM YYYY')}`
        : '—';

type ColumnOptions = {
    readOnly?: boolean;
    canDecide?: boolean;
    onReview?: (row: ApprovalRow) => void;
    onToggle?: (row: ApprovalRow, approved: boolean) => void;
    togglingKey?: string | null;
};

export const approvalColumns = ({
    readOnly = false,
    canDecide = false,
    onReview,
    onToggle,
    togglingKey = null,
}: ColumnOptions = {}): GenericColumns<ApprovalRow> => [
    {
        title: 'Service',
        key: 'service',
        width: 240,
        render: (_, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium text-textHeadings">
                    {row.label}
                </Typography.Text>
                <Typography.Text className="text-xs text-navTextColor">
                    {row.accessKey}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Switched On',
        key: 'switchedOn',
        width: 120,
        render: (_, row) => <StatusPill {...switchedOnPill(row.switchedOn)} />,
    },
    {
        title: 'Readiness',
        key: 'readiness',
        width: 200,
        render: (_, row) => <ReadinessCell readiness={row.readiness} />,
    },
    {
        title: 'Journal Evidence',
        key: 'evidence',
        width: 190,
        render: (_, row) => <EvidenceCell evidence={row.evidence} />,
    },
    {
        title: 'Approval Status',
        key: 'status',
        width: 250,
        render: (_, row) => (
            <Flex vertical gap={4} align="start">
                <Flex gap={6} align="center" wrap="wrap">
                    <StatusPill {...approvalStatusPill(row.status)} />
                    {row.drift?.changed ? <DriftTag drift={row.drift} /> : null}
                </Flex>
                <Typography.Text className="text-xs text-navTextColor">
                    {decidedLine(row)}
                </Typography.Text>
            </Flex>
        ),
    },
    ...(readOnly || !canDecide
        ? []
        : [
              {
                  title: 'Approved',
                  key: 'approved',
                  width: 110,
                  neverFold: true,
                  render: (_: unknown, row: ApprovalRow) => (
                      <ApprovalSwitch
                          row={row}
                          loading={togglingKey === `${row.partnerPermissionId}:${row.nodeKey}`}
                          onToggle={onToggle}
                      />
                  ),
              },
          ]),
    ...(readOnly
        ? []
        : [
              {
                  title: '',
                  key: 'actions',
                  width: 100,
                  neverFold: true,
                  render: (_: unknown, row: ApprovalRow) => (
                      <Button size="small" onClick={() => onReview?.(row)}>
                          {canDecide ? 'Review' : 'View'}
                      </Button>
                  ),
              },
          ]),
];
