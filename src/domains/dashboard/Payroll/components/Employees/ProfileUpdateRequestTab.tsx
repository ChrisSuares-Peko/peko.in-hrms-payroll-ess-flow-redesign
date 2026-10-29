import { useEffect, useState } from 'react';

import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Avatar, Button, Col, Input, Pagination, Row, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import useScreenSize from '@src/hooks/useScreenSize';

import ProfileUpdateDrawer from './ProfileUpdateDrawer';
import { useGetProfileUpdateRequestsApi } from '../../hooks/employeeHooks/useProfileUpdateRequestsApi';

const stripEmoji = (value: string) =>
    value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

export type ChangeItem = {
    field: string;
    current: string;
    requested: string;
};

export type ProfileUpdateRecord = {
    key: string;
    name: string;
    email: string;
    initials: string;
    avatarBg: string;
    avatarTextColor: string;
    profileImage?: string;
    employeeId: string;
    designation: string;
    employmentType: string;
    updateType: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    profileChanges?: ChangeItem[];
    bankChanges?: ChangeItem[];
};

const statusConfig: Record<
    ProfileUpdateRecord['status'],
    { color: string; bg: string; dot: string }
> = {
    Pending: { color: '#B54708', bg: '#FEF6E7', dot: '#F59E0B' },
    Approved: { color: '#027A48', bg: '#ECFDF3', dot: '#12B76A' },
    Rejected: { color: '#B42318', bg: '#FEF2F2', dot: '#EF4444' },
};

const renderStatus = (status: ProfileUpdateRecord['status']) => {
    const cfg = statusConfig[status];
    return (
        <Tag
            style={{
                color: cfg.color,
                backgroundColor: cfg.bg,
                borderColor: 'transparent',
                borderRadius: 9999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 10px',
            }}
        >
            <span
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: cfg.dot,
                    display: 'inline-block',
                    flexShrink: 0,
                }}
            />
            {status}
        </Tag>
    );
};

const PAGE_SIZE = 10;

const nameCell = (record: ProfileUpdateRecord) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {record.profileImage ? (
            <Avatar size={40} src={record.profileImage} style={{ flexShrink: 0 }} />
        ) : (
            <Avatar
                size={40}
                style={{
                    backgroundColor: '#fde3cf',
                    color: 'red',
                    fontWeight: 600,
                    flexShrink: 0,
                }}
            >
                {record.initials}
            </Avatar>
        )}
        <div>
            <div style={{ fontWeight: 500, color: '#101828', fontSize: 14 }}>{record.name}</div>
            <div style={{ color: '#6B788E', fontSize: 13 }}>{record.email}</div>
        </div>
    </div>
);

const desktopColumns = (
    onView: (record: ProfileUpdateRecord) => void
): ColumnsType<ProfileUpdateRecord> => [
    {
        title: 'Name',
        key: 'name',
        render: (_, r) => nameCell(r),
        width: 220,
    },
    {
        title: 'Employee ID',
        dataIndex: 'employeeId',
        key: 'employeeId',
        render: id => (
            <span style={{ color: '#091E42', fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap' }}>
                {id}
            </span>
        ),
    },
    {
        title: 'Designation',
        key: 'designation',
        render: (_, r) => (
            <div>
                <div style={{ color: '#42526D', fontSize: 14 }}>{r.designation}</div>
                <div style={{ color: '#8993A4', fontSize: 12 }}>{r.employmentType}</div>
            </div>
        ),
    },
    {
        title: 'Update Type',
        dataIndex: 'updateType',
        key: 'updateType',
        render: t => <span style={{ color: '#42526D', fontSize: 14 }}>{t}</span>,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: renderStatus,
    },
    {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
            <Button
                size="small"
                style={{
                    borderColor: '#CBD5E1',
                    color: '#475569',
                    borderRadius: 8,
                    fontWeight: 500,
                }}
                onClick={() => onView(record)}
            >
                View
            </Button>
        ),
    },
];

const mobilePrimaryColumns = (
    expandedKeys: string[],
    onToggle: (key: string) => void
): ColumnsType<ProfileUpdateRecord> => [
    {
        title: 'Employee',
        key: 'name',
        render: (_, r) => nameCell(r),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: renderStatus,
        width: 110,
    },
    {
        title: '',
        key: 'expand',
        width: 40,
        render: (_, r) => (
            <Button
                type="text"
                size="small"
                icon={expandedKeys.includes(r.key) ? <UpOutlined /> : <DownOutlined />}
                onClick={() => onToggle(r.key)}
            />
        ),
    },
];

const mobileExpandedRow =
    (onView: (record: ProfileUpdateRecord) => void) => (record: ProfileUpdateRecord) => {
        const { employeeId, designation, updateType } = record;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                <div>
                    <span style={{ color: '#8993A4', fontSize: 12 }}>Employee ID: </span>
                    <span style={{ color: '#091E42', fontWeight: 500, fontSize: 13 }}>
                        {employeeId}
                    </span>
                </div>
                <div>
                    <span style={{ color: '#8993A4', fontSize: 12 }}>Designation: </span>
                    <span style={{ color: '#42526D', fontSize: 13 }}>{designation}</span>
                </div>
                <div>
                    <span style={{ color: '#8993A4', fontSize: 12 }}>Update Type: </span>
                    <span style={{ color: '#42526D', fontSize: 13 }}>{updateType}</span>
                </div>
                <Button
                    size="small"
                    style={{
                        alignSelf: 'flex-start',
                        marginTop: 4,
                        borderColor: '#CBD5E1',
                        color: '#475569',
                        borderRadius: 8,
                    }}
                    onClick={() => onView(record)}
                >
                    View Details
                </Button>
            </div>
        );
    };

interface ProfileUpdateRequestTabProps {
    onPendingCountChange?: (count: number) => void;
}

const ProfileUpdateRequestTab = ({ onPendingCountChange }: ProfileUpdateRequestTabProps) => {
    const { xs } = useScreenSize();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [drawerRecord, setDrawerRecord] = useState<ProfileUpdateRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { requestData, requestLoading, requestTotal, pendingCount } =
        useGetProfileUpdateRequestsApi(page, PAGE_SIZE, search, drawerOpen);

    useEffect(() => {
        onPendingCountChange?.(pendingCount);
    }, [pendingCount, onPendingCountChange]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleView = (record: ProfileUpdateRecord) => {
        setDrawerRecord(record);
        setDrawerOpen(true);
    };

    const columns = xs
        ? mobilePrimaryColumns(expandedKeys, toggleExpand)
        : desktopColumns(handleView);

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 16,
                }}
            >
                <Input
                    placeholder="Search by name, role or ID"
                    prefix={<SearchOutlined />}
                    allowClear
                    value={search}
                    onChange={e => {
                        setSearch(stripEmoji(e.target.value));
                        setPage(1);
                    }}
                    style={{ maxWidth: xs ? '100%' : 320 }}
                />
            </div>

            <Table
                columns={columns}
                dataSource={requestData}
                loading={requestLoading}
                rowKey="key"
                expandable={
                    xs
                        ? {
                              expandedRowKeys: expandedKeys,
                              expandedRowRender: mobileExpandedRow(handleView),
                              expandIcon: () => null,
                              showExpandColumn: false,
                          }
                        : undefined
                }
                pagination={false}
                tableLayout={xs ? 'fixed' : 'auto'}
                scroll={xs ? undefined : { x: 'max-content' }}
                size="middle"
            />
            <Row>
                <Col span={24}>
                    {requestData.length > 0 && (
                        <Pagination
                            current={page}
                            size="default"
                            className="md:text-end pt-7 xs:text-center"
                            total={requestTotal}
                            onChange={p => setPage(p)}
                            defaultPageSize={PAGE_SIZE}
                        />
                    )}
                </Col>
            </Row>

            <ProfileUpdateDrawer
                open={drawerOpen}
                record={drawerRecord}
                onClose={() => {
                    setDrawerOpen(false);
                    setDrawerRecord(null);
                }}
            />
        </>
    );
};

export default ProfileUpdateRequestTab;
