import React from 'react';

import { CheckCircleFilled, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';

import bankIcon from '../../assets/icons/customers/bank.svg';
import { BANK_NAMES } from '../../constants';
import { BankAccountFormValues } from '../../types/customer';

interface BankAccountCardProps {
    account: BankAccountFormValues;
    onEdit: () => void;
    onRemove?: () => void;
}

const BankAccountCard: React.FC<BankAccountCardProps> = ({ account, onEdit, onRemove }) => {
    const prefix = account.ifscCode.slice(0, 4).toUpperCase();
    const bankName = account?.ifsc_details?.bank ?? BANK_NAMES[prefix] ?? `${prefix} Bank`;

    return (
        <Flex
            gap={10}
            className="bg-[#F9FAFB] border border-[#E4E4E7] rounded-lg p-2.5 items-start sm:items-center"
        >
            <Flex
                align="center"
                justify="center"
                className="w-9 h-9 bg-[#EFF6FF] rounded-lg flex-shrink-0"
            >
                <img src={bankIcon} alt="bank" className="w-5 h-5" />
            </Flex>
            <Flex vertical gap={2} className="flex-1 min-w-0">
                <Flex align="center" gap={6}>
                    <Typography.Text strong className="text-sm text-[#101828]">
                        {bankName}
                    </Typography.Text>
                    <Tag
                        icon={<CheckCircleFilled />}
                        color="success"
                        className="text-[10px] leading-none m-0 px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    >
                        Verified
                    </Tag>
                </Flex>
                <Flex gap={4} wrap className="leading-none">
                    <Typography.Text className="text-xs text-[#667085] whitespace-nowrap leading-none">
                        Account Number:{account.accountNumber}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-[#667085] whitespace-nowrap leading-none">
                        IFSC Code:{account.ifscCode}
                    </Typography.Text>
                </Flex>
            </Flex>
            <Button
                type="link"
                danger
                size="small"
                icon={<EditOutlined />}
                className="flex-shrink-0 -mt-1.5 sm:mt-0"
                onClick={onEdit}
            />
            {onRemove && (
                <Button
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    className="flex-shrink-0 -mt-1.5 sm:mt-0"
                    onClick={onRemove}
                />
            )}
        </Flex>
    );
};

export default React.memo(BankAccountCard);
