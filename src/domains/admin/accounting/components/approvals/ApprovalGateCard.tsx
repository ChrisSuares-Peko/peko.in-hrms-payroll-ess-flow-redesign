import { useState } from 'react';

import { SafetyCertificateOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Flex, Skeleton, Switch, Typography } from 'antd';
import dayjs from 'dayjs';

import { APPROVAL_GATE_CARD_TITLE } from './approvalColumns';
import GateConfirmModal from './GateConfirmModal';
import { faqHint } from '../../faq/FaqHint';
import { ApprovalGate } from '../../types/approvals';

type ApprovalGateCardProps = {
    gate: ApprovalGate | null;
    isLoading: boolean;
    isSaving?: boolean;
    canToggle: boolean;
    onToggle?: (enabled: boolean) => Promise<boolean>;
    withFaq?: boolean;
};

export const ADMIN_ONLY_TEXT = 'Only an administrator can change this.';

const changedLine = (gate: ApprovalGate | null) =>
    gate?.setAt
        ? `Changed by ${gate.setByName || 'an administrator'} on ${dayjs(gate.setAt).format('DD MMM YYYY')}`
        : 'Never changed';

const ApprovalGateCard = ({
    gate,
    isLoading,
    isSaving = false,
    canToggle,
    onToggle,
    withFaq = false,
}: ApprovalGateCardProps) => {
    const [pending, setPending] = useState<boolean | null>(null);
    const enabled = gate ? gate.enabled : true;

    const confirm = async () => {
        if (pending === null || !onToggle) return;
        await onToggle(pending);
        setPending(null);
    };

    return (
        <Card className="w-full h-full border-0 shadow-none bg-bgIconCard rounded-xl">
            {isLoading && !gate ? (
                <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
                <Flex gap={14} align="center" className="h-full">
                    <Flex
                        align="center"
                        justify="center"
                        className={`w-10 h-10 shrink-0 bg-white rounded-full text-lg ${
                            enabled ? 'text-textHeadings' : 'text-red-600'
                        }`}
                    >
                        {enabled ? <SafetyCertificateOutlined /> : <WarningOutlined />}
                    </Flex>
                    <Flex vertical gap={4} className="min-w-0 flex-1">
                        <Typography.Text className="text-[13px] text-textBody">
                            {APPROVAL_GATE_CARD_TITLE}
                            {withFaq
                                ? faqHint('Approvals', 'Cards', APPROVAL_GATE_CARD_TITLE)
                                : null}
                        </Typography.Text>
                        <Typography.Text
                            className={`text-lg font-semibold ${enabled ? 'text-textHeadings' : 'text-red-600'}`}
                        >
                            {enabled ? 'On — enforced' : 'Off — dev mode'}
                        </Typography.Text>
                        <Typography.Text className="text-xs text-navTextColor">
                            {changedLine(gate)}
                        </Typography.Text>
                        {!canToggle && (
                            <Typography.Text className="text-xs text-navTextColor">
                                {ADMIN_ONLY_TEXT}
                            </Typography.Text>
                        )}
                    </Flex>
                    {canToggle && (
                        <Switch
                            checked={enabled}
                            loading={isSaving}
                            aria-label="Approval gate"
                            onChange={next => setPending(next)}
                        />
                    )}
                </Flex>
            )}
            <GateConfirmModal
                open={pending !== null}
                turningOff={pending === false}
                isSaving={isSaving}
                onCancel={() => setPending(null)}
                onConfirm={confirm}
            />
        </Card>
    );
};

export default ApprovalGateCard;
