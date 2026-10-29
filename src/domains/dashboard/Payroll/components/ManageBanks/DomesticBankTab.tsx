import { BankOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';

import BankAccountCard from './BankAccountCard';
import { LABEL_COLOR, RED } from './constants';
import ExpandedBankCard from './ExpandedBankCard';
import { ManageBankDisplayAccount } from '../../types/bankAccount';

const { Text } = Typography;

interface DomesticBankTabProps {
    accounts: ManageBankDisplayAccount[];
    isLoading: boolean;
    expandedId: string | null;
    onCardClick: (id: string) => void;
    onAdd: () => void;
    onEdit: (account: ManageBankDisplayAccount) => void;
    onDelete?: (id: string) => void;
}

const DomesticBankTab = ({
    accounts,
    isLoading,
    expandedId,
    onCardClick,
    onAdd,
    onEdit,
    onDelete,
}: DomesticBankTabProps) => {
    const expandedAccount = accounts.find((a) => a._id === expandedId) ?? null;

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 4 }} />;
    }

    if (accounts.length === 0) {
        return (
            <Flex
                justify="center"
                align="center"
                style={{ padding: '60px 0', background: '#f8fafc', borderRadius: 12 }}
            >
                <Flex vertical align="center" gap={8}>
                    <BankOutlined style={{ fontSize: 36, color: '#cbd5e1' }} />
                    <Text style={{ color: LABEL_COLOR, fontSize: 14 }}>
                        No bank accounts added yet.
                    </Text>
                    <Button
                        onClick={onAdd}
                        style={{ borderRadius: 8, borderColor: RED, color: RED, marginTop: 4 }}
                    >
                        + Add Bank Account
                    </Button>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {accounts.map((acc) => (
                    <BankAccountCard
                        key={acc._id}
                        account={acc}
                        isExpanded={expandedId === acc._id}
                        onClick={() => onCardClick(acc._id)}
                    />
                ))}
            </div>
            {expandedAccount && (
                <ExpandedBankCard
                    account={expandedAccount}
                    onEdit={() => onEdit(expandedAccount)}
                    onDelete={
                        expandedAccount.accountSource === 'MANAGE_BANKS' && onDelete
                            ? () => onDelete(expandedAccount._id)
                            : undefined
                    }
                />
            )}
        </Flex>
    );
};

export default DomesticBankTab;
