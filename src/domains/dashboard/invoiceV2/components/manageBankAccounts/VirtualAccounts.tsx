import React from 'react';

import { Flex, Tag, Typography } from 'antd';

import BankAccountsSkeleton from './BankAccountsSkeleton';
import BankCard from './BankCard';
import EmptyAccounts from './EmptyAccounts';
import { VirtualAccount } from '../../types/ManageBankAccounts';

interface VirtualAccountsProps {
    accounts: VirtualAccount[];
    isLoading: boolean;
}

const VirtualAccounts: React.FC<VirtualAccountsProps> = ({ accounts, isLoading }) => (
    <Flex vertical gap={16}>
        <Typography.Text className="text-sm text-[#6A7282]">
            Manage your virtual accounts for international transactions
        </Typography.Text>

        {isLoading && <BankAccountsSkeleton count={1} />}
        {!isLoading && accounts.length === 0 && <EmptyAccounts />}
        {!isLoading && accounts.length > 0 && (
            <Flex vertical gap={12}>
                {accounts.map(account => (
                    <BankCard
                        key={account.id}
                        name={account.name}
                        badge={
                            <Tag
                                color={account.type === 'Domestic' ? 'blue' : 'green'}
                                bordered={false}
                                className="rounded-full text-xs font-medium px-3"
                            >
                                {account.type}
                            </Tag>
                        }
                        fields={[
                            { label: 'Bank Name', value: account.bankName },
                            { label: 'Account Number', value: account.accountNumber },
                            { label: 'IFSC Code', value: account.ifsc },
                            { label: 'SWIFT Code', value: account.swiftCode },
                            { label: 'IBAN', value: account.iban },
                            { label: 'Currency', value: account.currency },
                        ].filter((f): f is { label: string; value: string } => !!f.value)}
                    />
                ))}
            </Flex>
        )}
    </Flex>
);

export default React.memo(VirtualAccounts);
