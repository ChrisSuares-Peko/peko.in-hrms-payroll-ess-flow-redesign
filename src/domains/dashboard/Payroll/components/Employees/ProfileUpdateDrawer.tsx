import { ArrowRightOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Drawer, Tag, Typography } from 'antd';

import type { ProfileUpdateRecord } from './ProfileUpdateRequestTab';
import { useProfileUpdateAction } from '../../hooks/employeeHooks/useProfileUpdateAction';

interface Props {
    open: boolean;
    record: ProfileUpdateRecord | null;
    onClose: () => void;
}

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
    Pending: { color: '#B54708', bg: '#FEF6E7', dot: '#F59E0B' },
    Approved: { color: '#027A48', bg: '#ECFDF3', dot: '#12B76A' },
    Rejected: { color: '#B42318', bg: '#FEF2F2', dot: '#EF4444' },
};

const ChangeRow = ({
    field,
    current,
    requested,
}: {
    field: string;
    current: string;
    requested: string;
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span
            style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#98A2B3',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
            }}
        >
            {field}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
                style={{
                    backgroundColor: '#F5F6F7',
                    color: '#98A2B3',
                    textDecoration: 'line-through',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                }}
            >
                {current}
            </span>
            <ArrowRightOutlined style={{ color: '#98A2B3', fontSize: 13, flexShrink: 0 }} />
            <span
                style={{
                    backgroundColor: '#FFF1F0',
                    color: '#B42318',
                    fontWeight: 500,
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                }}
            >
                {requested}
            </span>
        </div>
    </div>
);

const SectionCard = ({
    icon,
    title,
    count,
    changes,
}: {
    icon: React.ReactNode;
    title: string;
    count: number;
    changes: { field: string; current: string; requested: string }[];
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#FFF1F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 16,
                        color: '#FF4F4F',
                    }}
                >
                    {icon}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#101828' }}>{title}</span>
            </div>
            <span
                style={{
                    backgroundColor: '#F5F6F7',
                    color: '#6B788E',
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '3px 8px',
                    borderRadius: 12,
                }}
            >
                {count} change{count !== 1 ? 's' : ''}
            </span>
        </div>
        <div
            style={{
                border: '1px solid #EAECF0',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                backgroundColor: '#fff',
            }}
        >
            {changes.map(c => (
                <ChangeRow
                    key={c.field}
                    field={c.field}
                    current={c.current}
                    requested={c.requested}
                />
            ))}
        </div>
    </div>
);

const ProfileUpdateDrawer = ({ open, record, onClose }: Props) => {
    const { approve, reject, approving, rejecting } = useProfileUpdateAction();
    const statusCfg = record ? (statusConfig[record.status] ?? statusConfig.Pending) : null;
    const isPending = record?.status === 'Pending';

    const handleApprove = async () => {
        if (!record) return;
        const isApproved = await approve(record.key);
        if (isApproved) onClose();
    };

    const handleReject = async () => {
        if (!record) return;
        const isRejected = await reject(record.key);
        if (isRejected) onClose();
    };

    const drawerTitle = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography.Text
                style={{ fontSize: 18, fontWeight: 600, color: '#101828', display: 'block' }}
            >
                Profile Update Request
            </Typography.Text>
            <Typography.Text style={{ fontSize: 13, color: '#6B788E', fontWeight: 400 }}>
                Review the changes requested by the employee
            </Typography.Text>
        </div>
    );

    const drawerFooter = isPending ? (
        <div style={{ display: 'flex', gap: 12 }}>
            <Button
                style={{
                    flex: 1,
                    height: 48,
                    borderColor: '#FDA29B',
                    color: '#B42318',
                    fontWeight: 500,
                }}
                onClick={handleReject}
                loading={rejecting}
                disabled={approving}
            >
                Reject
            </Button>
            <Button
                type="primary"
                danger
                style={{ flex: 1, height: 48, fontWeight: 500 }}
                loading={approving}
                disabled={rejecting}
                onClick={handleApprove}
            >
                Approve
            </Button>
        </div>
    ) : null;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="right"
            width="min(520px, 100vw)"
            title={drawerTitle}
            footer={drawerFooter}
            styles={{
                header: { borderBottom: '1px solid #EAECF0', padding: '20px 24px' },
                body: {
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    overflowY: 'auto',
                },
                footer: { borderTop: '1px solid #EAECF0', padding: '16px 24px' },
            }}
        >
            {record && (
                <>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            borderBottom: '1px solid #EAECF0',
                            paddingBottom: 20,
                        }}
                    >
                        <Avatar
                            size={48}
                            src={record.profileImage || undefined}
                            style={{
                                backgroundColor: record.avatarBg,
                                color: record.avatarTextColor,
                                flexShrink: 0,
                                fontWeight: 600,
                                fontSize: 17,
                            }}
                        >
                            {!record.profileImage && record.initials}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: '#101828',
                                    lineHeight: '22px',
                                }}
                            >
                                {record.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: '#6B788E',
                                    lineHeight: '16px',
                                    marginTop: 2,
                                }}
                            >
                                {record.designation} · {record.employmentType} · ID{' '}
                                {record.employeeId}
                            </div>
                        </div>
                        {statusCfg && (
                            <Tag
                                style={{
                                    backgroundColor: statusCfg.bg,
                                    color: statusCfg.color,
                                    borderColor: 'transparent',
                                    borderRadius: 16,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 10px',
                                    fontWeight: 500,
                                    fontSize: 12,
                                    flexShrink: 0,
                                }}
                            >
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '50%',
                                        backgroundColor: statusCfg.dot,
                                        display: 'inline-block',
                                    }}
                                />
                                {record.status}
                            </Tag>
                        )}
                    </div>

                    {record.profileChanges && record.profileChanges.length > 0 && (
                        <SectionCard
                            icon={<UserOutlined />}
                            title="Profile Details"
                            count={record.profileChanges.length}
                            changes={record.profileChanges}
                        />
                    )}

                    {record.bankChanges && record.bankChanges.length > 0 && (
                        <SectionCard
                            icon={<BankOutlined />}
                            title="Bank Details"
                            count={record.bankChanges.length}
                            changes={record.bankChanges}
                        />
                    )}
                </>
            )}
        </Drawer>
    );
};

export default ProfileUpdateDrawer;
