import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import { AccountTypeIcon } from './BankAccountCard';
import { CARD_BORDER, LABEL_COLOR, VALUE_COLOR } from './constants';
import { ManageBankDisplayAccount } from '../../types/bankAccount';

const { Text } = Typography;

interface ExpandedBankCardProps {
    account: ManageBankDisplayAccount;
    onEdit: () => void;
    onDelete?: () => void;
}

const ExpandedBankCard = ({ account, onEdit, onDelete }: ExpandedBankCardProps) => (
    <div
        style={{
            width: '100%',
            border: CARD_BORDER,
            borderRadius: 12,
            padding: '20px 24px',
            background: '#fff',
        }}
    >
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
            <Flex align="center" gap={10}>
                <AccountTypeIcon />
                <Flex vertical gap={2}>
                    <Text style={{ fontSize: 'clamp(14px, 1.05vw, 17px)', fontWeight: 600, color: VALUE_COLOR }}>
                        {account.accountType === 'current' ? 'Current Account' : 'Savings Account'}
                    </Text>
                    <Text style={{ fontSize: 'clamp(12px, 0.85vw, 14px)', color: LABEL_COLOR }}>
                        {account.accountHolderName}
                    </Text>
                </Flex>
            </Flex>
            <Flex gap={8} align="center">
                {onDelete && (
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                        style={{ borderRadius: 8, fontSize: 'clamp(12px, 0.85vw, 14px)' }}
                    >
                        Delete
                    </Button>
                )}
                <Button
                    icon={<EditOutlined />}
                    onClick={onEdit}
                    style={{ borderRadius: 8, borderColor: '#e2e8f0', color: VALUE_COLOR }}
                >
                    Edit
                </Button>
            </Flex>
        </Flex>

        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 24px',
                marginTop: 20,
            }}
        >
            {[
                { label: 'Account Name', value: account.accountHolderName },
                { label: 'Account Number', value: account.accountNumber },
                { label: 'IFSC Code', value: account.ifscCode },
                { label: 'Branch', value: account.branch || '—' },
            ].map(({ label, value }) => (
                <Flex key={label} vertical gap={4}
                    style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}
                >
                    <Text style={{ fontSize: 'clamp(11px, 0.78vw, 13px)', color: LABEL_COLOR }}>{label}</Text>
                    <Text style={{ fontSize: 'clamp(13px, 0.9vw, 15px)', fontWeight: 600, color: VALUE_COLOR }}>
                        {value}
                    </Text>
                </Flex>
            ))}
        </div>
    </div>
);

export default ExpandedBankCard;
