import { CreditCardOutlined } from '@ant-design/icons';
import { Card, Flex, Row, Typography } from 'antd';

import { LABEL_COLOR, PRIMARY_BORDER, VALUE_COLOR, maskAccountNumber } from './constants';

const { Text } = Typography;

interface VASummaryCardProps {
    accountName: string | null;
    virtualAccountNumber: string | null;
}

const VASummaryCard = ({ accountName, virtualAccountNumber }: VASummaryCardProps) => (
    <Row style={{ marginBottom: 16, width: '100%' }}>
        <Card
            style={{ border: PRIMARY_BORDER, width: 'min(100%, 280px)' }}
            styles={{ body: { padding: 16 } }}
        >
            <Flex vertical gap={12}>
                <Flex align="center" gap={10}>
                    <Flex
                        justify="center"
                        align="center"
                        style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9' }}
                    >
                        <CreditCardOutlined style={{ fontSize: 20, color: '#475569' }} />
                    </Flex>
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Text style={{ fontSize: 15, fontWeight: 600, color: VALUE_COLOR }}>
                            Virtual Account
                        </Text>
                        <Text style={{ fontSize: 12, color: LABEL_COLOR }} ellipsis={{ tooltip: accountName || '—' }}>
                            {accountName || '—'}
                        </Text>
                    </Flex>
                </Flex>
                <Flex justify="space-between" align="center" gap={12}>
                    <Text style={{ fontSize: 12, color: LABEL_COLOR }}>Ac No.</Text>
                    <Text style={{ fontSize: 13, fontWeight: 500, color: VALUE_COLOR, letterSpacing: 1, wordBreak: 'break-word' }}>
                        {virtualAccountNumber ? maskAccountNumber(virtualAccountNumber) : '—'}
                    </Text>
                </Flex>
            </Flex>
        </Card>
    </Row>
);

export default VASummaryCard;
