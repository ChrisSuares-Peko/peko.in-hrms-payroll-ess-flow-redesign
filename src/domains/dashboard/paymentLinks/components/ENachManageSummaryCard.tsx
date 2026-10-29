import { Card, Descriptions, Divider, Flex, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { ENachMandateListItem } from '../types/paymentLinkTypes';
import { formatAmount, getStatusColorEnachMandate } from '../utils/data';

interface ENachManageSummaryCardProps {
    mandate: ENachMandateListItem | null;
    mandateAmount: number;
    currentStatus: string;
}

const ENachManageSummaryCard = ({ mandate, mandateAmount, currentStatus }: ENachManageSummaryCardProps) => {
    const statusTagConfig = getStatusColorEnachMandate(currentStatus);

    return (
        <Card>
            <Flex justify="space-between" align="center">
                <Typography.Text strong>Mandate Details</Typography.Text>
                <Tag
                    style={{
                        color: statusTagConfig.color,
                        background: statusTagConfig.bg,
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 500,
                    }}
                >
                    {currentStatus || '-'}
                </Tag>
            </Flex>
            <Divider style={{ margin: '12px 0' }} />
            <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 3 }}
                items={[
                    {
                        key: 'customer_name',
                        label: 'Customer',
                        children: <Typography.Text>{mandate?.customer_name || '-'}</Typography.Text>,
                    },
                    {
                        key: 'account_number',
                        label: 'Account Number',
                        children: <Typography.Text>{mandate?.account_number || '-'}</Typography.Text>,
                    },
                    {
                        key: 'account_type',
                        label: 'Account Type',
                        children: <Typography.Text>{mandate?.account_type || '-'}</Typography.Text>,
                    },
                    {
                        key: 'frequency',
                        label: 'Frequency',
                        children: <Typography.Text>{mandate?.frequency || '-'}</Typography.Text>,
                    },
                    {
                        key: 'authentication_mode',
                        label: 'Authentication Mode',
                        children: <Typography.Text>{mandate?.authentication_mode || '-'}</Typography.Text>,
                    },
                    {
                        key: 'category_code',
                        label: 'Category',
                        children: <Typography.Text>{mandate?.category_code || '-'}</Typography.Text>,
                    },
                    {
                        key: 'amount_rule',
                        label: 'Amount Rule',
                        children: <Typography.Text>{String(mandate?.amount_rule || '-').toUpperCase()}</Typography.Text>,
                    },
                    {
                        key: 'amount',
                        label: 'Amount',
                        children: <Typography.Text>{formatAmount(mandateAmount)}</Typography.Text>,
                    },
                    {
                        key: 'start_date',
                        label: 'Start Date',
                        children: (
                            <Typography.Text>
                                {mandate?.start_date ? dayjs(mandate.start_date).format('DD MMM YYYY') : '-'}
                            </Typography.Text>
                        ),
                    },
                    {
                        key: 'end_date',
                        label: 'End Date',
                        children: (
                            <Typography.Text>
                                {mandate?.end_date ? dayjs(mandate.end_date).format('DD MMM YYYY') : '-'}
                            </Typography.Text>
                        ),
                    },
                ]}
            />
        </Card>
    );
};

export default ENachManageSummaryCard;
