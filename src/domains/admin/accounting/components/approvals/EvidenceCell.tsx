import { Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { ApprovalEvidence } from '../../types/approvals';

const EvidenceCell = ({ evidence }: { evidence: ApprovalEvidence | null }) => {
    if (!evidence) return <span className="text-navTextColor">—</span>;
    if (evidence.successOrders === 0) {
        return (
            <Typography.Text className="text-xs text-navTextColor">No orders yet</Typography.Text>
        );
    }
    return (
        <Flex vertical>
            <Typography.Text className={evidence.recorded ? 'text-textHeadings' : 'text-amber-700'}>
                {`${evidence.recorded} of ${evidence.successOrders} recorded`}
            </Typography.Text>
            {evidence.lastRecordedAt && (
                <Typography.Text className="text-xs text-navTextColor">
                    {`Last ${dayjs(evidence.lastRecordedAt).format('DD MMM YYYY')}`}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default EvidenceCell;
