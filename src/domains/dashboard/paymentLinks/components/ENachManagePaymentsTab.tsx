import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { ENachMandateExecutionListItem } from '../types/paymentLinkTypes';

interface ENachManagePaymentsTabProps {
    payments: ENachMandateExecutionListItem[];
    paymentColumns: ColumnsType<ENachMandateExecutionListItem>;
    paymentPage: number;
    paymentTotal: number;
    isFetchingPayments: boolean;
    onRefresh: () => void;
    onOpenInitiateDrawer: () => void;
    onPageChange: (page: number) => void;
    isInitiateDisabled: boolean;
    initiationEligibilityMessage: string;
    initiationEligibilityToneColor: string;
    showNextAllowedAt: boolean;
    nextAllowedAtLabel: string | null;
    pageSize: number;
}

const ENachManagePaymentsTab = ({
    payments,
    paymentColumns,
    paymentPage,
    paymentTotal,
    isFetchingPayments,
    onRefresh,
    onOpenInitiateDrawer,
    onPageChange,
    isInitiateDisabled,
    initiationEligibilityMessage,
    initiationEligibilityToneColor,
    showNextAllowedAt,
    nextAllowedAtLabel,
    pageSize,
}: ENachManagePaymentsTabProps) => (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
            <Space direction="vertical" size={2}>
                <Typography.Text strong>Payments Initiated</Typography.Text>
                <Typography.Text type="secondary">
                    Review payment history or initiate a new mandate payment.
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11, color: initiationEligibilityToneColor }}>
                    {initiationEligibilityMessage}
                </Typography.Text>
                {showNextAllowedAt && nextAllowedAtLabel ? (
                    <Typography.Text style={{ fontSize: 11 }} type="secondary">
                        Next allowed at: {nextAllowedAtLabel}
                    </Typography.Text>
                ) : null}
            </Space>
            <Space size={8} wrap>
                <Button
                    type="primary"
                    danger
                    onClick={onOpenInitiateDrawer}
                    disabled={isInitiateDisabled}
                >
                    Initiate Payment
                </Button>
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={isFetchingPayments}>
                    Refresh
                </Button>
            </Space>
        </Flex>

        <Table
            columns={paymentColumns}
            dataSource={payments}
            loading={isFetchingPayments}
            rowKey={record =>
                record.id ||
                record.execution_reference_id ||
                `${record.mandate_reference_id}-${record.createdAt}`
            }
            pagination={{
                current: paymentPage,
                pageSize,
                total: paymentTotal,
                showSizeChanger: false,
                onChange: onPageChange,
            }}
        />
    </Space>
);

export default ENachManagePaymentsTab;
