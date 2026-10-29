import type { KeyboardEvent } from 'react';

import { BankOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import {
    BADGE_BG,
    BADGE_TEXT,
    CARD_BORDER,
    LABEL_COLOR,
    PRIMARY_BORDER,
    VALUE_COLOR,
    cardBase,
    maskAccountNumber,
} from './constants';
import { ManageBankDisplayAccount } from '../../types/bankAccount';

const { Text } = Typography;

export const PrimaryBadge = () => (
    <Flex
        justify="center"
        align="center"
        style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: BADGE_BG,
            border: `1px solid ${BADGE_TEXT}`,
            borderRadius: 999,
            padding: '2px 12px',
            whiteSpace: 'nowrap',
            zIndex: 1,
        }}
    >
        <Text style={{ color: BADGE_TEXT, fontSize: 12, fontWeight: 500 }}>Primary</Text>
    </Flex>
);

export const AccountTypeIcon = () => (
    <Flex
        justify="center"
        align="center"
        style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: '#f1f5f9',
            flexShrink: 0,
        }}
    >
        <BankOutlined style={{ fontSize: 20, color: '#475569' }} />
    </Flex>
);

interface BankAccountCardProps {
    account: ManageBankDisplayAccount;
    isExpanded: boolean;
    onClick: () => void;
}

const BankAccountCard = ({ account, isExpanded, onClick }: BankAccountCardProps) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            style={{
                ...cardBase,
                border: isExpanded ? PRIMARY_BORDER : CARD_BORDER,
                boxShadow: isExpanded ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
            }}
            onClick={onClick}
            onKeyDown={handleKeyDown}
        >
            <Flex vertical gap={12}>
                <Flex align="center" gap={10}>
                    <AccountTypeIcon />
                    <Flex vertical gap={4} style={{ minWidth: 0 }}>
                        <Text style={{ fontSize: 'clamp(13px, 1vw, 16px)', fontWeight: 600, color: VALUE_COLOR }}>
                            {account.accountType === 'current' ? 'Current Account' : 'Savings Account'}
                        </Text>
                        <Text style={{ fontSize: 'clamp(11px, 0.8vw, 13px)', color: LABEL_COLOR }}>
                            {account.accountHolderName}
                        </Text>
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text style={{ fontSize: 'clamp(11px, 0.8vw, 13px)', color: LABEL_COLOR }}>Ac No.</Text>
                    <Text style={{ fontSize: 'clamp(12px, 0.85vw, 14px)', fontWeight: 500, color: VALUE_COLOR, letterSpacing: 1 }}>
                        {maskAccountNumber(account.accountNumber)}
                    </Text>
                </Flex>
            </Flex>
        </div>
    );
};

export default BankAccountCard;
