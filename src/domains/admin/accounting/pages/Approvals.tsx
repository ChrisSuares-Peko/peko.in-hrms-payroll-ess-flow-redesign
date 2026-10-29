import { useState } from 'react';

import { Flex } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useIsSystemAdmin from '@src/hooks/useIsSystemAdmin';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import ApprovalGateCard from '../components/approvals/ApprovalGateCard';
import ApprovalReviewModal from '../components/approvals/ApprovalReviewModal';
import ApprovalsList from '../components/approvals/ApprovalsList';
import RejectServiceModal from '../components/approvals/RejectServiceModal';
import { ACCOUNTING_SERVICE_CATEGORY } from '../config/servicePaths';
import { useApprovalGate } from '../context/ApprovalGateContext';
import useApprovalDecision from '../hooks/useApprovalDecision';
import { ApprovalTarget } from '../hooks/useApprovalReview';
import { ApprovalDecision, ApprovalRow } from '../types/approvals';
import { approvalsPath, describeDecisionResult, partnerLabel } from '../utils/approvals';

export const APPROVALS_INTRO =
    'Every service a partner switches on is checked here before that partner’s corporates can see it. Pick a partner to see its services as its own menu lists them.';

const keyOf = (row: ApprovalRow) => `${row.partnerPermissionId}:${row.nodeKey}`;

const Approvals = () => {
    const dispatch = useAppDispatch();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, 'Approvals', ACCOUNTING_SERVICE_CATEGORY);
    const canDecide = Boolean(access?.update);
    const isAdmin = useIsSystemAdmin();
    const gate = useApprovalGate();
    const { decide, isDeciding } = useApprovalDecision();
    const [reviewing, setReviewing] = useState<ApprovalTarget | null>(null);
    const [rejecting, setRejecting] = useState<ApprovalRow | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);

    const decideRow = async (row: ApprovalRow, decision: ApprovalDecision, note?: string) => {
        setTogglingKey(keyOf(row));
        const result = await decide({
            nodeKey: row.nodeKey,
            partnerPermissionIds: [row.partnerPermissionId],
            decision,
            note,
        });
        setTogglingKey(null);
        if (!result) return;
        dispatch(showToast(describeDecisionResult(result, decision, () => partnerLabel(row))));
        if (result.decided > 0) setRefreshToken(token => token + 1);
    };

    const onToggle = (row: ApprovalRow, approved: boolean) => {
        if (approved) decideRow(row, 'APPROVED');
        else setRejecting(row);
    };

    const confirmReject = async (note: string) => {
        if (!rejecting) return;
        await decideRow(rejecting, 'REJECTED', note);
        setRejecting(null);
    };

    return (
        <Flex vertical gap={16}>
            <ApprovalsList
                withFaq
                canDecide={canDecide}
                onReview={row =>
                    setReviewing({
                        partnerPermissionId: row.partnerPermissionId,
                        nodeKey: row.nodeKey,
                    })
                }
                onToggle={onToggle}
                togglingKey={togglingKey}
                intro={APPROVALS_INTRO}
                kpiTo={approvalsPath}
                refreshToken={refreshToken}
                renderGateCard={() => (
                    <ApprovalGateCard
                        gate={gate.gate}
                        isLoading={gate.isLoading}
                        isSaving={gate.isSaving}
                        canToggle={isAdmin}
                        onToggle={gate.setEnabled}
                        withFaq
                    />
                )}
            />
            {reviewing && (
                <ApprovalReviewModal
                    open
                    target={reviewing}
                    canDecide={canDecide}
                    onClose={() => setReviewing(null)}
                    onDecided={() => setRefreshToken(token => token + 1)}
                />
            )}
            <RejectServiceModal
                row={rejecting}
                isSaving={isDeciding}
                onCancel={() => setRejecting(null)}
                onConfirm={confirmReject}
            />
        </Flex>
    );
};

export default Approvals;
