import { Card, Divider, Flex, Typography } from 'antd';

import { CARD_BODY_CLASS } from '../../../constants/style';
import { PaymentDetailsData } from '../../../types/payments';
import { toInitials } from '../../../utils/helperFunctions';
import ReceiptRow from '../../shared/ReceiptRow';

function CustomerInformation({ data }: { data: PaymentDetailsData | null }) {
    const name = data?.customerName ?? '-';
    const initials = name !== '-' ? toInitials(name) : '--';

    return (
        <Card className="rounded-xl" classNames={{ body: CARD_BODY_CLASS }}>
            <Typography.Text className="text-base font-semibold leading-6">
                Customer Information
            </Typography.Text>
            <Flex align="center" gap={10}>
                <Flex
                    align="center"
                    justify="center"
                    className="w-9 h-9 bg-red-700 rounded-xl flex-shrink-0"
                >
                    <Typography.Text className="text-white text-sm font-semibold">
                        {initials}
                    </Typography.Text>
                </Flex>
                <Flex vertical gap={2}>
                    <Typography.Text className="text-sm font-semibold leading-5">
                        {name}
                    </Typography.Text>
                    {data?.customerPhone && (
                        <Typography.Text className="text-gray-400 text-xs font-normal leading-5">
                            {data.customerPhone}
                        </Typography.Text>
                    )}
                </Flex>
            </Flex>
            <Divider className="m-0" />
            <Flex vertical gap={10}>
                <ReceiptRow label="Email" value={data?.customerEmail ?? '-'} />
                <ReceiptRow label="Phone" value={data?.customerPhone ?? '-'} />
                <ReceiptRow label="GST" value={data?.customerGst ?? '-'} />
                <ReceiptRow label="Address" value={data?.customerAddress ?? '-'} align="flex-start" valueClassName="whitespace-pre-line text-left break-words min-w-0" />
                <ReceiptRow label="Pincode" value={data?.customerPincode ?? '-'} />
                <ReceiptRow label="Country" value={data?.customerCountry || 'India'} />
            </Flex>
        </Card>
    );
}

export default CustomerInformation;
