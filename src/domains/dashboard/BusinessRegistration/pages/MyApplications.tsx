import { useEffect, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Select, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { ApplicationListRow, getApplications } from '../api';
import redoIcon from '../assets/redo.svg';
import { updateApplicationData } from '../slices/businessRegistrationSlice';
import { EntityType } from '../types';
import { applicationStepLabel, buildRegisterPath } from '../utils/data';

const { Text } = Typography;

// Full entity labels per the My Applications design (Figma 2563:24569).
const ENTITY_LABELS: Record<string, string> = {
    proprietorship: 'Proprietorship Registration',
    partnership: 'Partnership Firm Registration',
    opc: 'One Person Company (OPC) Registration',
    private_limited: 'Private Limited Company Registration',
    llp: 'Limited Liability Partnership (LLP) Registration',
};

// Design shows two states: drafts are "Incompleted", everything submitted is
// "Completed" (rejection kept as a sensible extension).
const badgeFor = (row: ApplicationListRow) => {
    if (row.status === 'PENDING') return { label: 'Incompleted', bg: '#fffbeb', color: '#f59e0b' };
    if (row.status === 'REJECTED') return { label: 'Rejected', bg: '#fef2f2', color: '#ef4444' };
    return { label: 'Completed', bg: '#ecfdf5', color: '#43b75d' };
};

const STATUS_FILTER_OPTIONS = [
    { value: 'incompleted', label: 'Incompleted' },
    { value: 'completed', label: 'Completed' },
];

// The proposed 1st-choice name — the human-readable identifier when several
// drafts share the same entity type. businessName is the BE-extracted copy.
const proposedName = (row: ApplicationListRow): string =>
    row.businessName ||
    ((row.applicationData?.proposedNames as { first?: string } | undefined)?.first ?? '') ||
    '—';

const fmtDate = (iso?: string): string =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Time shown under the date so the user can tell apart same-day draft applications.
const fmtTime = (iso?: string): string =>
    iso
        ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '';

// Entity | Proposed name | Application ID | Created | Status | Action.
const COLS = 'grid grid-cols-[1.3fr_1.2fr_150px_120px_110px_140px_180px] items-center gap-2';

// Order history for all the corporate's applications (drafts + submitted) —
// drafts resume the form, submitted applications open live tracking.
const MyApplications = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<ApplicationListRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    useEffect(() => {
        let active = true;
        getApplications({ userId: Number(userId), userType: userType ?? '', limit: 50 }).then(res => {
            if (!active) return;
            if (res && Array.isArray(res.applications)) setRows(res.applications);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [userId, userType]);

    const handleContinue = (row: ApplicationListRow) => {
        const paid = row.paymentStatus === 'COMPLETED';
        dispatch(
            updateApplicationData({
                ...(row.applicationData ?? {}),
                entityType: row.entityType as EntityType,
                applicationId: row.applicationId,
                paymentCompleted: paid,
            })
        );
        navigate(
            buildRegisterPath(row.entityType, {
                applicationId: row.applicationId,
                status: paid ? 'success' : undefined,
            })
        );
    };

    const handleTrack = (row: ApplicationListRow) => {
        navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.tracking}`, {
            state: { applicationId: row.applicationId },
        });
    };

    const visibleRows = rows.filter(row => {
        if (!statusFilter) return true;
        const isDraft = row.status === 'PENDING';
        return statusFilter === 'incompleted' ? isDraft : !isDraft;
    });

    const renderRow = (row: ApplicationListRow) => {
        const isDraft = row.status === 'PENDING';
        const badge = badgeFor(row);
        const step = applicationStepLabel(row.entityType, row.status, row.paymentStatus, row.applicationData);
        return (
            <div key={row.applicationId} className={`${COLS} border-b border-[#eaecf0] px-[15px] h-[70px]`}>
                <Text className="!text-[16px] !text-black truncate pr-2" title={ENTITY_LABELS[row.entityType] ?? row.entityType}>
                    {ENTITY_LABELS[row.entityType] ?? row.entityType}
                </Text>
                <Text className="!text-[15px] !text-[#1e293b] truncate pr-2" title={proposedName(row)}>
                    {proposedName(row)}
                </Text>
                <Text className="!text-[13px] !text-[#64748b] truncate pr-2" title={row.applicationId}>
                    {row.applicationId}
                </Text>
                <div className="min-w-0 pr-2">
                    <Text className="!block !text-[13px] !text-[#64748b] truncate">{fmtDate(row.createdAt)}</Text>
                    <Text className="!block !text-[11px] !text-[#94a3b8] truncate">{fmtTime(row.createdAt)}</Text>
                </div>
                <div>
                    <span
                        className="inline-flex items-center justify-center rounded-[9px] w-[96px] py-[2px] text-[14px] font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                        {badge.label}
                    </span>
                </div>
                <Text className="!text-[14px] !text-[#475569] truncate pr-2" title={step}>
                    {step}
                </Text>
                <div className="flex justify-end">
                    <Button
                        icon={
                            isDraft ? (
                                <img src={redoIcon} alt="" className="w-[17px] h-[17px]" />
                            ) : (
                                <EyeOutlined style={{ fontSize: 15 }} />
                            )
                        }
                        onClick={() => (isDraft ? handleContinue(row) : handleTrack(row))}
                        className="!h-[35px] !w-[160px] !text-[11px] !rounded-[6px] !bg-white !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
                    >
                        {isDraft ? 'Continue application' : 'View status'}
                    </Button>
                </div>
            </div>
        );
    };

    const renderBody = () => {
        if (loading) {
            return (
                <Flex justify="center" align="center" style={{ minHeight: '40vh' }}>
                    <Spin size="large" />
                </Flex>
            );
        }
        if (!visibleRows.length) {
            return (
                <Flex vertical align="center" gap={16} style={{ minHeight: '40vh' }} justify="center">
                    <Empty description={statusFilter ? 'No applications match this status' : 'No applications yet'} />
                    {!statusFilter && (
                        <Button
                            type="primary"
                            onClick={() =>
                                navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.form}`)
                            }
                            className="!bg-[#ff4f4f]"
                        >
                            Start a registration
                        </Button>
                    )}
                </Flex>
            );
        }
        return (
            <div className="overflow-x-auto">
                <div className="min-w-[1180px]">
                    <div className={`${COLS} bg-[#fafafa] border-b border-[#eaecf0] px-[15px] h-[43px]`}>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Entity type</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Proposed name</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Application ID</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Created</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Status</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)]">Step</Text>
                        <Text className="!text-[14px] !font-medium !text-[rgba(0,0,0,0.85)] text-right">Action</Text>
                    </div>
                    {visibleRows.map(renderRow)}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white min-h-screen p-3 sm:p-6">
            <div className="max-w-[1500px] mx-auto">
                <div className="bg-white border border-[#dbdbdb] rounded-[30px] p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-[26px]">
                        <Text className="!text-[24px] !font-medium !text-[#171717] !leading-[1.12]">
                            My Applications
                        </Text>
                        <Select
                            allowClear
                            placeholder="Select Status"
                            options={STATUS_FILTER_OPTIONS}
                            onChange={value => setStatusFilter(value)}
                            className="w-full sm:w-[208px] [&_.ant-select-selector]:!rounded-[8px]"
                        />
                    </div>

                    {renderBody()}
                </div>
            </div>
        </div>
    );
};

export default MyApplications;
