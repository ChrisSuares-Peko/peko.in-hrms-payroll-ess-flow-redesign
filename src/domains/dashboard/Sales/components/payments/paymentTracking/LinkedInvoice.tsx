import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { CARD_BODY_CLASS } from '../../../constants/style';
import { PaymentDetailsData } from '../../../types/payments';
import { formatAmount, toInitials } from '../../../utils/helperFunctions';

const PAID_STATUSES = ['PAID', 'SUCCESS', 'COMPLETED'];

function LinkedInvoice({ data }: { data: PaymentDetailsData | null }) {
    const navigate = useNavigate();

    const name = data?.customerName ?? '-';
    const initials = name !== '-' ? toInitials(name) : '--';

    const isPaid = PAID_STATUSES.includes((data?.invoiceStatus ?? '').toUpperCase());

    const handleViewInvoice = () => {
        if (!data?.invoiceId) return;
        navigate(
            `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.invoicedetails.replace(':id', String(data.invoiceId))}`
        );
    };

    return (
        <Card classNames={{ body: CARD_BODY_CLASS }} className="rounded-xl">
            <Typography.Text className="text-base font-semibold leading-6">
                Linked Invoice
            </Typography.Text>
            <Flex justify="space-between" align="center">
                <Flex align="center" gap={10}>
                    <Flex
                        align="center"
                        justify="center"
                        className="w-9 h-9 bg-[#BB2929] rounded-xl flex-shrink-0"
                    >
                        <Typography.Text className="text-white text-sm font-semibold">
                            {initials}
                        </Typography.Text>
                    </Flex>
                    <Flex vertical gap={2}>
                        <Typography.Text className="text-sm font-semibold leading-5">
                            {name}
                        </Typography.Text>
                        <Typography.Text className="text-gray-400 text-xs font-normal leading-5">
                            {data?.invoiceRef ?? '-'}
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Flex vertical gap={2} align="flex-end">
                    <Typography.Text className="text-sm font-semibold leading-5">
                        {data?.amount != null ? formatAmount(data.amount) : '-'}
                    </Typography.Text>
                    <Typography.Text
                        className={`text-xs font-normal leading-5 ${isPaid ? 'text-[#43B75D]' : 'text-[#F97316]'}`}
                    >
                        {isPaid ? 'Fully Paid' : (data?.invoiceStatus ?? '-')}
                    </Typography.Text>
                </Flex>

                <Button
                    icon={<EyeOutlined />}
                    iconPosition="end"
                    className="h-9 px-4 rounded-md border-[#E4E4E7] text-[#42526D] text-sm font-medium"
                    onClick={handleViewInvoice}
                    disabled={!data?.invoiceId}
                >
                    View Invoice
                </Button>
            </Flex>
        </Card>
    );
}

export default LinkedInvoice;
