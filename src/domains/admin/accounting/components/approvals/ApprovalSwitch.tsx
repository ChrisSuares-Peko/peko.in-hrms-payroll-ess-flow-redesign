import { Switch, Tooltip } from 'antd';

import { ApprovalRow } from '../../types/approvals';
import { blockedForApproval, describeBlocking } from '../../utils/approvals';

type ApprovalSwitchProps = {
    row: ApprovalRow;
    loading: boolean;
    onToggle?: (row: ApprovalRow, approved: boolean) => void;
};

export const switchLabelFor = (row: ApprovalRow) => `Approve ${row.label}`;

const ApprovalSwitch = ({ row, loading, onToggle }: ApprovalSwitchProps) => {
    const approved = row.status === 'APPROVED';
    const blocked = !approved && blockedForApproval(row);
    const title =
        blocked && row.readiness
            ? `Fix the failing checks before approving: ${describeBlocking(row.readiness.blocking)}`
            : undefined;

    return (
        <Tooltip title={title}>
            <span className="inline-flex">
                <Switch
                    checked={approved}
                    disabled={blocked}
                    loading={loading}
                    aria-label={switchLabelFor(row)}
                    onChange={next => onToggle?.(row, next)}
                />
            </span>
        </Tooltip>
    );
};

export default ApprovalSwitch;
