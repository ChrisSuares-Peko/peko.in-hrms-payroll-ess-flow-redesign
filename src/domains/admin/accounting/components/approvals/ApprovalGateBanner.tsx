import { Alert, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { accountingLeafPath } from '../../config/servicePaths';
import { useApprovalGate } from '../../context/ApprovalGateContext';
import { approvalsPath } from '../../utils/approvals';

export const GATE_BANNER_MESSAGE =
    'Dev mode: the approval gate is off — unapproved services are visible to corporates';
export const GATE_BANNER_DESCRIPTION =
    'Every switched-on service is live for corporates whether or not accounting has approved it. Turn the gate back on from Approvals.';

const ApprovalGateBanner = () => {
    const { gate, isLoading } = useApprovalGate();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    if (isLoading || !gate || gate.enabled) return null;

    const onApprovals = pathname
        .replace(/\/$/, '')
        .startsWith(accountingLeafPath(paths.accountingAdmin.approvals));

    return (
        <Alert
            type="error"
            showIcon
            className="!mb-5"
            message={GATE_BANNER_MESSAGE}
            description={GATE_BANNER_DESCRIPTION}
            action={
                onApprovals ? undefined : (
                    <Button size="small" danger onClick={() => navigate(approvalsPath())}>
                        Open Approvals
                    </Button>
                )
            }
        />
    );
};

export default ApprovalGateBanner;
