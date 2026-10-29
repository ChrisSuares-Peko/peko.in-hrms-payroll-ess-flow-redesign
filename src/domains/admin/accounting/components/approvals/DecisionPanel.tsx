import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Input, Typography } from 'antd';

import { ApprovalDecision, ApprovalDecisionResultItem, ApprovalRow } from '../../types/approvals';
import {
    NOTE_MAX,
    blockedForApproval,
    describeBlocking,
    partnerLabel,
    refusalReason,
} from '../../utils/approvals';

type DecisionPanelProps = {
    decision: ApprovalDecision;
    candidates: ApprovalRow[];
    currentLabel: string;
    selectedIds: number[];
    onSelect: (ids: number[]) => void;
    note: string;
    onNoteChange: (note: string) => void;
    noteError: string | null;
    offlineWarning: string | null;
    refused: ApprovalDecisionResultItem[];
};

const DecisionPanel = ({
    decision,
    candidates,
    currentLabel,
    selectedIds,
    onSelect,
    note,
    onNoteChange,
    noteError,
    offlineWarning,
    refused,
}: DecisionPanelProps) => {
    const approving = decision === 'APPROVED';
    const eligible = candidates.filter(row => !(approving && blockedForApproval(row)));
    const nameOf = (id: number) =>
        partnerLabel(candidates.find(row => row.partnerPermissionId === id) || null);

    return (
        <Flex vertical gap={14} className="rounded-xl border border-solid border-borderCard p-4">
            <Flex justify="space-between" align="center" gap={8} wrap="wrap">
                <Typography.Text strong className="text-textHeadings">
                    {approving ? 'Approve for' : 'Reject for'}
                </Typography.Text>
                {eligible.length > 1 && (
                    <Button
                        type="link"
                        size="small"
                        className="!px-0"
                        onClick={() => onSelect(eligible.map(row => row.partnerPermissionId))}
                    >
                        Select all eligible
                    </Button>
                )}
            </Flex>
            <div className="max-h-56 overflow-y-auto">
                <Checkbox.Group
                    value={selectedIds}
                    onChange={values => onSelect(values.map(Number))}
                    className="flex flex-col gap-2"
                >
                    {candidates.map(row => {
                        const blocked = approving && blockedForApproval(row);
                        return (
                            <Checkbox
                                key={row.partnerPermissionId}
                                value={row.partnerPermissionId}
                                disabled={blocked}
                            >
                                <Flex vertical>
                                    <Typography.Text className="text-textHeadings">
                                        {partnerLabel(row)}
                                        {row.label !== currentLabel
                                            ? ` · shown as “${row.label}”`
                                            : ''}
                                    </Typography.Text>
                                    {blocked && row.readiness ? (
                                        <Typography.Text className="text-xs text-red-700">
                                            {`${row.readiness.blocking.length} ${row.readiness.blocking.length === 1 ? 'check' : 'checks'} failing: ${describeBlocking(row.readiness.blocking)}`}
                                        </Typography.Text>
                                    ) : null}
                                </Flex>
                            </Checkbox>
                        );
                    })}
                </Checkbox.Group>
                {!candidates.length && (
                    <Typography.Text className="text-[13px] text-textBody">
                        {approving
                            ? 'Every partner carrying this service is already approved.'
                            : 'Every partner carrying this service is already rejected.'}
                    </Typography.Text>
                )}
            </div>
            <Flex vertical gap={6}>
                <Typography.Text className="text-sm text-textBody">
                    {approving ? 'Note (optional)' : 'Note (required)'}
                </Typography.Text>
                <Input.TextArea
                    rows={3}
                    maxLength={NOTE_MAX}
                    value={note}
                    placeholder={
                        approving
                            ? 'Anything worth keeping with this approval'
                            : 'Why this service is being rejected'
                    }
                    status={noteError ? 'error' : undefined}
                    onChange={event => onNoteChange(event.target.value)}
                />
                {noteError && (
                    <Typography.Text className="text-xs text-errorTextRed">
                        {noteError}
                    </Typography.Text>
                )}
            </Flex>
            {offlineWarning && (
                <Flex
                    gap={8}
                    align="start"
                    className="rounded-xl border border-errorTextRed/30 bg-bgLightPink px-4 py-3"
                >
                    <InfoCircleOutlined className="mt-0.5 shrink-0 text-errorTextRed" />
                    <Typography.Text className="text-sm text-errorTextRed">
                        {offlineWarning}
                    </Typography.Text>
                </Flex>
            )}
            {refused.length > 0 && (
                <Flex vertical gap={4}>
                    {refused.map(item => (
                        <Typography.Text
                            key={item.partnerPermissionId}
                            className="text-[13px] text-errorTextRed"
                        >
                            {`Refused for ${nameOf(item.partnerPermissionId)}: ${
                                item.blocking?.length
                                    ? item.blocking.map(check => check.label).join(', ')
                                    : refusalReason(item)
                            }`}
                        </Typography.Text>
                    ))}
                </Flex>
            )}
        </Flex>
    );
};

export default DecisionPanel;
