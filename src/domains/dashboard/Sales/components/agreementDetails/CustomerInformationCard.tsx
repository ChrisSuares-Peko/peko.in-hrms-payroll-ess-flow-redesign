import { Divider, Flex, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { toInitials } from '../../utils/helperFunctions';
import ReceiptRow from '../shared/ReceiptRow';

interface Props {
    customerName: string;
    email: string;
    phone: string;
    gstin?: string | null;
    address?: string | null;
}

const CustomerInformationCard = ({ customerName, email, phone, gstin, address }: Props) => (
    <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
        <TypographyText className="text-base font-semibold">Customer Information</TypographyText>
        <Flex align="center" gap={12}>
            <Flex
                justify="center"
                align="center"
                className="w-12 h-12 bg-red-700 rounded-2xl shrink-0"
            >
                <Typography.Text className="text-white text-sm font-semibold">
                    {toInitials(customerName)}
                </Typography.Text>
            </Flex>
            <Typography.Text className="text-sm font-semibold">{customerName}</Typography.Text>
        </Flex>
        <Divider className="my-0" style={{ borderColor: 'rgba(0,0,0,0.05)' }} />
        <Flex vertical gap={16}>
            <ReceiptRow label="Email" value={email} />
            <ReceiptRow label="Phone" value={phone} />
            {gstin && <ReceiptRow label="GSTIN" value={gstin} />}
            {address && <ReceiptRow label="Address" value={address} align="flex-start" valueClassName="whitespace-pre-line" />}
        </Flex>
    </Flex>
);

export default CustomerInformationCard;
