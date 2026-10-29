import { Divider, Flex, Tag, Typography } from 'antd';

import { Customer } from '../../types/agreement';

interface Props {
    customer: Customer;
}

const CustomerSelectionCard = ({ customer }: Props) => (
    <Flex vertical className="flex-1 rounded-xl border border-[#E5E7EB] overflow-hidden">
        <Flex align="center" gap={12} className="p-5 pb-4">
            <Flex
                justify="center"
                align="center"
                className="w-12 h-12 rounded-full bg-[#FF4F4F] shrink-0"
            >
                <Typography.Text className="text-base font-normal text-white">
                    {customer.initials}
                </Typography.Text>
            </Flex>
            <Flex vertical gap={4}>
                <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                    {customer.name}
                </Typography.Text>
                <Tag className="rounded-full border-0 bg-[#ECFDF5] text-[#43B75D] text-xs font-normal px-3 py-0.5 w-fit">
                    {customer.status} customer
                </Tag>
            </Flex>
        </Flex>
        <Divider className="my-0" />
        <Flex vertical gap={12} className="p-5 pt-4">
            {[
                { label: 'Contact person', value: customer.contactPerson },
                { label: 'Email', value: customer.email },
                { label: 'Phone', value: customer.phone },
                { label: 'Address', value: customer.address },
            ].map(({ label, value }) => (
                <Flex key={label} vertical gap={2}>
                    <Typography.Text className="text-xs font-normal text-[#6B7280]">
                        {label}
                    </Typography.Text>
                    <Typography.Text className="text-sm font-semibold text-[#1E293B] whitespace-pre-line">
                        {value}
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>
    </Flex>
);

export default CustomerSelectionCard;
