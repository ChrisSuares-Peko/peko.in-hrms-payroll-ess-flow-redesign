import React from 'react';

import { Flex, Typography } from 'antd';

import BankAccountsSkeleton from './BankAccountsSkeleton';
import BankCard from './BankCard';
import EmptyAccounts from './EmptyAccounts';
import useEscrowAccounts from '../../hooks/manageBankAccounts/useEscrowAccounts';

const EscrowAccounts: React.FC = () => {
    const { accounts, isLoading } = useEscrowAccounts();

    return (
        <Flex vertical gap={16}>
            <Typography.Text className="text-sm text-[#6A7282]">
                Manage your escrow accounts for secure international transactions
            </Typography.Text>

            {isLoading && <BankAccountsSkeleton count={1} />}
            {!isLoading && accounts.length === 0 && <EmptyAccounts />}
            {!isLoading && accounts.length > 0 && (
                <Flex vertical gap={12}>
                    {accounts.map(account => (
                        <BankCard
                            key={account.id}
                            name={account.name}
                            fields={[
                                { label: 'Bank Name', value: account.bankName },
                                { label: 'Account Number', value: account.accountNumber },
                                { label: 'SWIFT Code', value: account.swiftCode },
                                { label: 'Currency', value: account.currency },
                            ]}
                        />
                    ))}
                </Flex>
            )}
        </Flex>
    );
};

export default React.memo(EscrowAccounts);
