import { Tag, Tooltip, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { FiEdit2, FiEye, FiExternalLink } from 'react-icons/fi';
import type { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { COMPLIANCE_STATUS_CONFIG, SUBMISSION_STATUS_CONFIG, type MyComplianceRow } from './data';

const { Text } = Typography;

const CELL_COLOR = '#42526d';

const ActionBtn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <Tooltip title={title}>
        <button
            type="button"
            onClick={onClick}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ff4f4f' }}
        >
            {children}
        </button>
    </Tooltip>
);

export function getMyCompliancesColumns(navigate: NavigateFunction): TableColumnsType<MyComplianceRow> {
    return [
        {
            title: 'Compliance Item',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <Text style={{ color: CELL_COLOR }}>{text}</Text>,
        },
        {
            title: 'Compliance Type',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (_: string, record: MyComplianceRow) => {
                const category = record.apiRecord?.category ?? record.category;
                const label = category === 'one-time' ? 'One-time' : 'Recurring';
                return <Text style={{ color: CELL_COLOR }}>{category ? label : '--'}</Text>;
            },
        },
        {
            title: 'Priority',
            dataIndex: 'isHighPriority',
            key: 'isHighPriority',
            width: 100,
            render: (isHigh: boolean) => (
                <Text style={{ color: isHigh ? '#ff4f4f' : CELL_COLOR }}>
                    {isHigh ? 'High' : '--'}
                </Text>
            ),
        },
        {
            title: 'Department',
            dataIndex: 'organization',
            key: 'organization',
            render: (org: string) => <Text style={{ color: CELL_COLOR }}>{org || '--'}</Text>,
        },
        {
            title: 'Frequency',
            dataIndex: 'frequency',
            key: 'frequency',
            width: 120,
            render: (freq: string | undefined, record: MyComplianceRow) => {
                const validFrequencies = ['Annual', 'Quarterly', 'Monthly'];
                let display: string;
                if (freq && validFrequencies.includes(freq)) {
                    display = freq;
                } else if (record.apiRecord?.category) {
                    display = 'Annual';
                } else {
                    display = '--';
                }
                return <Text style={{ color: CELL_COLOR }}>{display}</Text>;
            },
        },
        {
            title: 'Days Left',
            dataIndex: 'daysLeft',
            key: 'daysLeft',
            width: 120,
            render: (daysLeft: string) => (
                <Text style={{ color: CELL_COLOR }}>{daysLeft === 'Completed' ? '--' : daysLeft}</Text>
            ),
        },
        {
            title: 'Submission',
            key: 'submission',
            width: 155,
            render: (_: unknown, record: MyComplianceRow) => {
                if (record.isDraft) {
                    const cfg = COMPLIANCE_STATUS_CONFIG.draft;
                    return (
                        <Tag style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`, borderRadius: 50, fontSize: 13, display: 'flex', alignItems: 'center', paddingInline: 10, width: 'fit-content' }}>
                            ● {cfg.label}
                        </Tag>
                    );
                }
                const adminStatus = record.apiRecord?.adminStatus ?? 'pending';
                const cfg = SUBMISSION_STATUS_CONFIG[adminStatus as keyof typeof SUBMISSION_STATUS_CONFIG] ?? SUBMISSION_STATUS_CONFIG.pending;
                const isActionable = adminStatus === 'pending' || adminStatus === 'rejected' || adminStatus === 'reopened';
                return (
                    <Tooltip title={isActionable ? 'Action required — click to re-upload' : ''}>
                        <Tag
                            onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.tracker.replace(':id', record.id)}`)}
                            style={{
                                color: cfg.color,
                                background: cfg.bg,
                                border: isActionable ? `1px solid ${cfg.color}44` : 'none',
                                borderRadius: 50,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                paddingInline: 10,
                                width: 'fit-content',
                                cursor: 'pointer',
                            }}
                        >
                            ● {cfg.label}
                        </Tag>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
            key: 'statusType',
            width: 140,
            render: (_: unknown, record: MyComplianceRow) => {
                if (record.isDraft) return <Text style={{ color: CELL_COLOR }}>--</Text>;
                const adminStatus = record.apiRecord?.adminStatus;
                if (!adminStatus || adminStatus === 'pending') return <Text style={{ color: CELL_COLOR }}>--</Text>;
                const derivedStatus = adminStatus === 'approved' ? 'processing' : 'pending';
                const cfg = COMPLIANCE_STATUS_CONFIG[derivedStatus];
                if (!cfg) return <Text style={{ color: CELL_COLOR }}>--</Text>;
                return (
                    <Tag
                        style={{
                            color: cfg.color,
                            background: cfg.bg,
                            border: 'none',
                            borderRadius: 50,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            paddingInline: 10,
                            width: 'fit-content',
                        }}
                    >
                        ● {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 96,
            align: 'center',
            render: (_: unknown, record: MyComplianceRow) => {
                const { id } = record;
                const toDetail = () => navigate(`${paths.dashboard.compliance}/${paths.compliance.detail.replace(':id', id)}`);
                const toTracker = () => navigate(`${paths.dashboard.compliance}/${paths.compliance.tracker.replace(':id', id)}`);

                if (record.isDraft) {
                    return <ActionBtn title="Continue filling" onClick={toDetail}><FiExternalLink size={18} /></ActionBtn>;
                }

                const adminStatus = record.apiRecord?.adminStatus;

                if (!adminStatus || adminStatus === 'pending') {
                    return <ActionBtn title="Continue filling" onClick={toDetail}><FiExternalLink size={18} /></ActionBtn>;
                }

                if (adminStatus === 'under_review') {
                    return <ActionBtn title="View application" onClick={toDetail}><FiEye size={20} /></ActionBtn>;
                }

                if (adminStatus === 'rejected' || adminStatus === 'reopened') {
                    return <ActionBtn title="Re-upload documents" onClick={toTracker}><FiEdit2 size={18} /></ActionBtn>;
                }

                return <ActionBtn title="View tracker" onClick={toTracker}><FiEye size={20} /></ActionBtn>;
            },
        },
    ];
}
