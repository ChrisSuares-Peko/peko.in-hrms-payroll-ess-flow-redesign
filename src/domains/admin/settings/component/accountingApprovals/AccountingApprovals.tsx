import { CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import ApprovalGateCard from '@src/domains/admin/accounting/components/approvals/ApprovalGateCard';
import ApprovalsList from '@src/domains/admin/accounting/components/approvals/ApprovalsList';
import { approvalsQuery } from '@src/domains/admin/accounting/utils/approvals';
import { paths } from '@src/routes/paths';

export const ACCOUNTING_APPROVALS_INTRO =
    'Which services accounting has approved for each partner, as each partner’s menu lists them. Decisions are taken in the Accounting portal.';

const listPath = `${paths.systemUser.settings}/${paths.settingsAdmin.accountingApprovals}`;

const AccountingApprovals = () => (
    <Flex vertical gap={20}>
        <Flex gap={12} align="center">
            <Flex
                align="center"
                justify="center"
                className="h-10 w-10 shrink-0 rounded-xl bg-bgIconCard text-lg text-textHeadings"
            >
                <CheckCircleOutlined />
            </Flex>
            <Typography.Title level={4} className="!mb-0 !text-textHeadings">
                Accounting Approvals
            </Typography.Title>
        </Flex>
        <ApprovalsList
            readOnly
            intro={ACCOUNTING_APPROVALS_INTRO}
            kpiTo={(partnerPermissionId, status) =>
                `${listPath}${approvalsQuery(partnerPermissionId, status)}`
            }
            renderGateCard={(gate, isLoading) => (
                <ApprovalGateCard gate={gate} isLoading={isLoading} canToggle={false} />
            )}
        />
    </Flex>
);

export default AccountingApprovals;
