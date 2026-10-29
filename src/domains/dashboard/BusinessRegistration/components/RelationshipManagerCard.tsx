import { ReactNode, useEffect, useState } from 'react';

import { UserOutlined } from '@ant-design/icons';
import { Avatar, Skeleton, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { callRm, getApplicationStatus } from '../api';
import callIcon from '../assets/call.svg';
import smsIcon from '../assets/sms.svg';
import { RELATIONSHIP_MANAGER as RM } from '../utils/proprietorKyc';
import { futureFollowup } from '../utils/tracking';

const { Text } = Typography;

// Peko's Exotel virtual number shown to the customer. The RM's real number is
// never displayed — calling this bridges the customer to the RM server-side
// (Exotel), keeping the RM number masked.
const PEKO_RM_CALL_NUMBER = '+91-951-3886363';

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-2">
        <Text className="!text-[14px] !text-[#94a3b8]">{label}</Text>
        <Text className="!text-[14px] !text-[#1e293b] !font-semibold text-right">{value}</Text>
    </div>
);

// "Call Us" / "Email Us" contact tile (Figma) — red icon in a soft badge + label
// over the value.
const ContactBox = ({
    icon,
    label,
    value,
    onClick,
    disabled,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    onClick?: () => void;
    disabled?: boolean;
}) => {
    const cls = `flex-1 min-w-0 w-full text-left border border-[#e4e4e7] rounded-[12px] p-3 flex items-center gap-2.5 ${
        onClick ? 'cursor-pointer hover:border-[#ff4f4f] transition-colors disabled:opacity-60' : ''
    }`;
    const inner = (
        <>
            <div className="flex-shrink-0 bg-[#fff2f2] rounded-[8px] w-[34px] h-[34px] flex items-center justify-center text-[#ff4f4f]">
                {icon}
            </div>
            <div className="min-w-0">
                <Text className="!block !text-[12px] !text-[#6a7282] !leading-[16px]">{label}</Text>
                <Text className="!block !text-[13px] !font-semibold !text-[#1e293b] truncate" title={value}>
                    {value}
                </Text>
            </div>
        </>
    );
    return onClick ? (
        <button type="button" className={cls} onClick={onClick} disabled={disabled}>
            {inner}
        </button>
    ) : (
        <div className={cls}>{inner}</div>
    );
};

// "Your Relationship Manager" sidebar card (Figma 1808:21171). Values come from
// the vendor engagement (via our status endpoint) — no placeholder person; until
// the engagement/RM exists the card shows the assignment-pending state.
const RelationshipManagerCard = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { currentApplication } = useAppSelector(state => state.reducer.businessRegistration);
    const applicationId = currentApplication?.applicationId as string | undefined;
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(true);
    const [calling, setCalling] = useState(false);

    // Bridge the customer to the RM via Exotel — the RM number stays server-side.
    const handleCall = async () => {
        if (!applicationId || calling) return;
        setCalling(true);
        const res = await callRm({ userId: Number(userId), userType: userType ?? '', applicationId });
        setCalling(false);
        if (res && typeof res === 'object' && 'error' in res) {
            dispatch(showToast({ description: res.error, variant: 'error' }));
        } else if (res) {
            dispatch(
                showToast({
                    description: 'Connecting your call — your phone will ring shortly.',
                    variant: 'success',
                })
            );
        } else {
            dispatch(
                showToast({
                    description: 'Could not connect the call. Please try again.',
                    variant: 'error',
                })
            );
        }
    };
    const [live, setLive] = useState<{
        name?: string;
        role?: string;
        email?: string;
        status?: string;
        statusNote?: string;
        lastNote?: string;
        nextUpdate?: string;
    }>({});

    useEffect(() => {
        if (!applicationId) {
            setIsLoading(false);
            return undefined;
        }
        let active = true;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;

        const fetchEngagement = async (allowRetry: boolean) => {
            const res = await getApplicationStatus({
                userId: Number(userId),
                userType: userType ?? '',
                applicationId,
            });
            if (!active) return;
            const engagement = res ? res.engagement : null;
            if (engagement) {
                const assigned = engagement.rm && engagement.rm !== 'Unassigned';
                const meaningful = (v?: string | null) =>
                    v && v !== 'Not Updated' ? v : undefined;
                setLive({
                    name: assigned ? engagement.rm : undefined,
                    role: engagement.rm_role || undefined,
                    // RM phone (rmsim) is intentionally NOT surfaced — the card
                    // shows Peko's masked call number instead. rmemail can be the
                    // generic support address while the RM is unassigned.
                    email: engagement.rmemail || undefined,
                    status: engagement.engagement_status || undefined,
                    statusNote: meaningful(engagement.micro_status),
                    lastNote: meaningful(engagement.last_notes),
                    nextUpdate: futureFollowup(engagement.next_followup),
                });
            } else if (allowRetry) {
                // The engagement is created in the background right after payment —
                // one delayed retry covers the race without polling.
                retryTimer = setTimeout(() => fetchEngagement(false), 12_000);
            }
            setIsLoading(false);
        };
        fetchEngagement(true);

        return () => {
            active = false;
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, [applicationId, userId, userType]);

    return (
        <div className="bg-white rounded-[30px] p-6 shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)] flex flex-col gap-4">
            <Text className="!text-[18px] !font-semibold !text-[#1e293b]">Your Relationship Manager</Text>
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} title={false} />
            ) : (
                <>
                    <div className="border border-[#e4e4e7] rounded-[16px] p-4 flex items-center gap-3">
                        <Avatar size={44} icon={<UserOutlined />} className="!bg-[#f1f5f9] !text-[#94a3b8]" />
                        <div className="min-w-0">
                            <Text className="!block !text-[16px] !font-semibold !text-[#1e293b] truncate">
                                {live.name ?? 'Being assigned…'}
                            </Text>
                            <Text className="!text-[14px] !text-[#6a7282]">
                                {live.role ?? 'Relationship Manager'}
                            </Text>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <ContactBox
                            icon={<img src={callIcon} alt="" aria-hidden className="w-4 h-4" />}
                            label={calling ? 'Connecting…' : 'Call Us'}
                            value={PEKO_RM_CALL_NUMBER}
                            onClick={handleCall}
                            disabled={calling || !applicationId}
                        />
                        <ContactBox
                            icon={<img src={smsIcon} alt="" aria-hidden className="w-4 h-4" />}
                            label="Email Us"
                            value={live.email || '—'}
                        />
                    </div>

                    <div className="h-px w-full bg-[#ebebeb]" />

                    <div className="flex flex-col gap-2">
                        <Row label="Status" value={live.status ?? '—'} />
                        {live.statusNote && (
                            <div className="bg-[#f8f8f8] rounded-[8px] px-3 py-2">
                                <Text className="!text-[12px] !text-[#6a7282] !leading-[18px]">
                                    {live.statusNote}
                                </Text>
                            </div>
                        )}
                        {live.lastNote && (
                            <Text className="!text-[12px] !text-[#6a7282] !leading-[18px]">
                                Latest update: {live.lastNote}
                            </Text>
                        )}
                        <Row label="Next Update" value={live.nextUpdate ?? '—'} />
                    </div>
                </>
            )}
            <div className="h-px w-full bg-[#ebebeb]" />
            <Text className="!text-[12px] !text-[#94a3b8] !leading-[18px]">{RM.footerNote}</Text>
        </div>
    );
};

export default RelationshipManagerCard;
