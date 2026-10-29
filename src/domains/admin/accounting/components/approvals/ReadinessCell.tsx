import { Flex, Typography } from 'antd';

import { ApprovalReadiness } from '../../types/approvals';
import { describeBlocking } from '../../utils/approvals';

const ReadinessCell = ({ readiness }: { readiness: ApprovalReadiness | null }) => {
    if (!readiness) return <span className="text-navTextColor">—</span>;
    if (readiness.total === 0) {
        return <Typography.Text className="text-xs text-navTextColor">No checks</Typography.Text>;
    }
    const ok = readiness.blocking.length === 0;
    return (
        <Flex vertical>
            <Typography.Text className={ok ? 'text-green-700' : 'text-red-700'}>
                {`${readiness.passed}/${readiness.total} checks`}
            </Typography.Text>
            {!ok && (
                <Typography.Text className="text-xs text-red-700">
                    {describeBlocking(readiness.blocking)}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default ReadinessCell;
