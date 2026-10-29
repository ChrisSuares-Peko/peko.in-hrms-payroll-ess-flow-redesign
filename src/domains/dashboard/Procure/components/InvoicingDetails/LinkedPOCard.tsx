import React from 'react';

import { Card, Flex, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

interface Props {
    purchaseOrder?: {
        refNumber?: string;
        status?: string;
        vendor?: { businessName?: string };
    };
}

const LinkedPOCard: React.FC<Props> = ({ purchaseOrder }) => (
     <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 }  }}>
        <Flex vertical gap={24}>
            <Flex vertical gap={4}>
                <Title level={4} style={{ margin: 0 }}>Linked Purchase Order</Title>
                <Text style={{ fontSize: 14, color: '#7d7d7d' }}>
                    This invoice is matched against the commercial terms of the PO.
                </Text>
            </Flex>

            <Flex vertical gap={12}>
                <Flex vertical gap={4}>
                    <Text style={{ fontSize: 18, fontWeight: 500, color: '#000' }}>{purchaseOrder?.refNumber ?? '—'}</Text>
                    <Text style={{ fontSize: 14, color: '#7d7d7d' }}>{purchaseOrder?.vendor?.businessName ?? '—'}</Text>
                </Flex>
                <Flex justify="space-between" align="center">
                    <Text style={{ fontSize: 16, color: '#000' }}>PO Status</Text>
                    <Tag style={{ background: '#f6f6f6', color: '#555', border: 'none', borderRadius: 20, padding: '2px 10px', margin: 0 }}>
                        {purchaseOrder?.status ?? '—'}
                    </Tag>
                </Flex>
            </Flex>
        </Flex>
    </Card>
);

export default LinkedPOCard;
