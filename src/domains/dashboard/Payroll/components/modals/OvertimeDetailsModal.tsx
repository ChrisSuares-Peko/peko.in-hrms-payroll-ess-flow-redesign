import { useCallback, useEffect, useState } from 'react';

import { Avatar, Descriptions, Modal, Spin, Tag, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { getOvertimeDetails } from '../../api/dashBoardIndex';
import type { OvertimeEntry } from '../../types/dashboardTypes';

interface Props {
    open: boolean;
    overtimeId: string | null;
    onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    requestedByEmployee: { label: 'Pending', color: '#B78912', bg: '#FFFAE6' },
    approved: { label: 'Approved', color: '#027A48', bg: '#ECFDF3' },
    rejected: { label: 'Rejected', color: '#CF4C00', bg: '#FFF9F5' },
};

const paymentStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PAID: { label: 'Paid', color: '#027A48', bg: '#ECFDF3' },
    UNPAID: { label: 'Unpaid', color: '#B78912', bg: '#FFFAE6' },
};

const formatInr = (v: number | null | undefined) => `₹${(v ?? 0).toFixed(2)}`;

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const getInitials = (name: string) =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

const OvertimeDetailsModal = ({ open, overtimeId, onClose }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<OvertimeEntry | null>(null);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!overtimeId) return;
        setLoading(true);
        const result = await getOvertimeDetails({ userType: role, userId: id, overtimeId });
        setData(result);
        setLoading(false);
    }, [role, id, overtimeId]);

    useEffect(() => {
        if (open) fetch();
        else setData(null);
    }, [open, fetch]);

    const emp = data?.employeeDetails ?? null;
    const statusCfg = data ? (statusConfig[data.status] ?? { label: data.status, color: '#595959', bg: '#f5f5f5' }) : null;
    const paymentCfg = data ? (paymentStatusConfig[data.paymentStatus] ?? { label: data.paymentStatus, color: '#595959', bg: '#f5f5f5' }) : null;

    return (
        <Modal open={open} title="Overtime Details" onCancel={onClose} footer={null} width={520}>
            <Spin spinning={loading}>
                {data && (
                    <>
                        {emp && (
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                <Avatar
                                    src={emp.profileImage || undefined}
                                    size={48}
                                    style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F', flexShrink: 0 }}
                                >
                                    {!emp.profileImage && getInitials(emp.fullName)}
                                </Avatar>
                                <div>
                                    <Typography.Text className="font-semibold text-base block">{emp.fullName}</Typography.Text>
                                    <Typography.Text className="text-gray-400 text-sm">{emp.email}</Typography.Text>
                                    {emp.designation && (
                                        <Typography.Text className="text-gray-400 text-sm block">{emp.designation}</Typography.Text>
                                    )}
                                </div>
                            </div>
                        )}
                        <Descriptions column={2} size="small" labelStyle={{ color: '#888', fontSize: 12 }}>
                            <Descriptions.Item label="Date">{formatDate(data.overTimeDate)}</Descriptions.Item>
                            <Descriptions.Item label="Extra Hours">{data.extraHours != null ? `${data.extraHours} hrs` : '--'}</Descriptions.Item>
                            <Descriptions.Item label="OT Rate">{data.overTimeRate != null ? `${data.overTimeRate}x` : '--'}</Descriptions.Item>
                            <Descriptions.Item label="Working Hrs">{data.totalWorkingHours != null ? `${data.totalWorkingHours} hrs` : '--'}</Descriptions.Item>
                            <Descriptions.Item label="Hourly Rate">{formatInr(data.hourlyRate)}</Descriptions.Item>
                            <Descriptions.Item label="OT Amount">{formatInr(data.overTimeAmount)}</Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                {paymentCfg && (
                                    <Tag style={{ color: paymentCfg.color, backgroundColor: paymentCfg.bg, borderColor: 'transparent', borderRadius: 9999 }}>
                                        {paymentCfg.label}
                                    </Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                {statusCfg && (
                                    <Tag style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, borderColor: 'transparent', borderRadius: 9999 }}>
                                        {statusCfg.label}
                                    </Tag>
                                )}
                            </Descriptions.Item>
                            {data.notes && <Descriptions.Item label="Notes" span={2}>{data.notes}</Descriptions.Item>}
                        </Descriptions>
                    </>
                )}
                {!loading && !data && <Typography.Text className="text-gray-400">No details available.</Typography.Text>}
            </Spin>
        </Modal>
    );
};

export default OvertimeDetailsModal;
