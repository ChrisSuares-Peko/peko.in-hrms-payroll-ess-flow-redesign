import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { ApprovalChecklistItem, ChecklistStatus } from '../../types/approvals';
import { fixPath } from '../../utils/approvals';

const ICONS: Record<ChecklistStatus, JSX.Element> = {
    pass: <CheckCircleOutlined className="mt-0.5 text-green-700" />,
    fail: <CloseCircleOutlined className="mt-0.5 text-red-600" />,
    warn: <ExclamationCircleOutlined className="mt-0.5 text-amber-600" />,
    info: <InfoCircleOutlined className="mt-0.5 text-navTextColor" />,
};

const ApprovalChecklist = ({ items }: { items: ApprovalChecklistItem[] }) => {
    const required = items.filter(item => item.required);
    const passed = required.filter(item => item.status === 'pass').length;

    return (
        <Flex vertical gap={10}>
            <Typography.Text className="text-[13px] text-textBody">
                {required.length
                    ? `${passed} of ${required.length} required checks pass`
                    : 'No required checks for this service'}
            </Typography.Text>
            {items.map(item => (
                <Flex key={item.key} gap={10} align="start" data-testid={`check-${item.key}`}>
                    {ICONS[item.status]}
                    <Flex vertical className="min-w-0 flex-1">
                        <Flex gap={8} align="center" wrap="wrap">
                            <Typography.Text strong className="text-textHeadings">
                                {item.label}
                            </Typography.Text>
                            {!item.required && (
                                <Typography.Text className="text-xs text-navTextColor">
                                    advisory
                                </Typography.Text>
                            )}
                        </Flex>
                        <Typography.Text className="text-[13px] text-textBody">
                            {item.detail}
                        </Typography.Text>
                    </Flex>
                    {item.fix && item.status !== 'pass' && (
                        <Link to={fixPath(item.fix)} className="shrink-0 text-[13px]">
                            Fix
                        </Link>
                    )}
                </Flex>
            ))}
        </Flex>
    );
};

export default ApprovalChecklist;
