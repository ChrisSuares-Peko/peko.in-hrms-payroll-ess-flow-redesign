import { ReactNode } from 'react';

import { CheckCircleFilled, ClockCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { Button, Typography } from 'antd';

import { formatCompleteDate } from '@utils/dateFormat';

import { MembershipRequest } from '../../api/user/membershipApi';
import { MembershipStatusCopy, STATUS_FIELD_LABELS, StatusTone } from '../../utils/membershipData';

const { Title, Text } = Typography;

const TONE = {
    success: {
        halo: 'bg-success-surface',
        ring: 'bg-success-border',
        text: 'text-success',
        dot: 'bg-success',
    },
    error: {
        halo: 'bg-bgLightPink/30',
        ring: 'bg-bgLightPink/60',
        text: 'text-textLightRed',
        dot: 'bg-textLightRed',
    },
    warning: {
        halo: 'bg-warning-surface',
        ring: 'bg-warning-border',
        text: 'text-warning',
        dot: 'bg-warning',
    },
} satisfies Record<StatusTone, { halo: string; ring: string; text: string; dot: string }>;

const ICON = {
    success: CheckCircleFilled,
    error: CloseCircleFilled,
    warning: ClockCircleFilled,
} satisfies Record<StatusTone, typeof CheckCircleFilled>;

const InfoCell = ({ label, value }: { label: string; value: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1">
        <Text className="text-[10px] text-textBody sm:text-xs">{label}</Text>
        <div className="break-words text-xs font-medium text-textHeadings sm:text-sm">{value}</div>
    </div>
);

interface MembershipStatusScreenProps {
    copy: MembershipStatusCopy;
    request: MembershipRequest | null;
    onAction?: () => void;
    actionLoading?: boolean;
}

/** The four non-member states — submitted, pending, approved, rejected — differ only in tone and copy. */
const MembershipStatusScreen = ({
    copy,
    request,
    onAction,
    actionLoading,
}: MembershipStatusScreenProps) => {
    const tone = TONE[copy.tone];
    const Icon = ICON[copy.tone];

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 py-4 text-center sm:gap-8 xl:py-8">
            <span
                className={`relative flex size-20 items-center justify-center rounded-full sm:size-28 ${tone.halo}`}
            >
                <span className={`absolute size-14 rounded-full sm:size-20 ${tone.ring}`} />
                <Icon className={`relative text-4xl sm:text-5xl ${tone.text}`} />
            </span>

            <div className="flex flex-col gap-2 sm:gap-3">
                <Title level={3} className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl">
                    {copy.title}
                </Title>
                <Text className="text-sm text-textBody">{copy.description}</Text>
            </div>

            {request && (
                <div className="w-full overflow-hidden rounded-2xl border border-borderCard">
                    <div className="grid grid-cols-1 gap-3 bg-bgGray px-4 py-3 text-left sm:grid-cols-3 sm:px-6 sm:py-4">
                        <InfoCell
                            label={STATUS_FIELD_LABELS.status}
                            value={
                                <span
                                    className={`flex items-center gap-1.5 font-medium ${tone.text}`}
                                >
                                    <span className={`size-1.5 rounded-full ${tone.dot}`} />
                                    {copy.statusLabel}
                                </span>
                            }
                        />
                        <InfoCell label={STATUS_FIELD_LABELS.requestId} value={request.requestId} />
                        <InfoCell
                            label={STATUS_FIELD_LABELS.requestedOn}
                            value={formatCompleteDate(request.requestedAt)}
                        />
                    </div>
                    {request.decisionNote && (
                        <div className="whitespace-pre-line break-words border-t border-borderCard px-4 py-3 text-center text-[10px] text-textHeadings sm:py-4 sm:text-xs">
                            <span className="font-semibold">{STATUS_FIELD_LABELS.reason}</span>{' '}
                            <span className="font-semibold">{request.decisionNote}</span>
                        </div>
                    )}
                </div>
            )}

            {copy.ctaLabel && onAction && (
                <Button
                    type="primary"
                    danger
                    onClick={onAction}
                    loading={actionLoading}
                    className="!h-10 !px-8 text-sm font-medium sm:!h-12 sm:!px-10 sm:text-base"
                >
                    {copy.ctaLabel}
                </Button>
            )}
        </div>
    );
};

export default MembershipStatusScreen;
