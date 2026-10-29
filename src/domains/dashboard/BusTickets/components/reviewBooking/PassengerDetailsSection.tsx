import { useState } from 'react';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { PassengerInfo } from './PassengerCard';

type Props = { passengers: PassengerInfo[] };

function InfoCol({ label, value }: { label: string; value: string }) {
    return (
        <Flex vertical gap={4}>
            <Typography.Text style={{ fontSize: 14, color: '#86898B' }}>{label}</Typography.Text>
            <Typography.Text style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>{value || '—'}</Typography.Text>
        </Flex>
    );
}

export default function PassengerDetailsSection({ passengers }: Props) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <Flex
            vertical
            style={{ border: '1px solid #D9D9D9', borderRadius: 18, overflow: 'hidden', background: 'white' }}
        >
            {/* Header */}
            <Flex
                justify="space-between"
                align="center"
                style={{
                    padding: '15px 35px',
                    cursor: 'pointer',
                    background: '#F9F9F9',
                    borderBottom: collapsed ? 'none' : '1px solid #D9D9D9',
                }}
                onClick={() => setCollapsed(c => !c)}
            >
                <Typography.Text style={{ fontSize: 20, fontWeight: 500, color: '#1A1A1A' }}>
                    Passenger Details
                </Typography.Text>
                {collapsed ? <DownOutlined /> : <UpOutlined />}
            </Flex>

            {!collapsed && (
                <Flex vertical gap={15} style={{ padding: '20px' }}>
                    {passengers.map((p) => (
                        <Flex
                            key={p.id}
                            vertical
                            gap={15}
                            style={{
                                background: 'white',
                                border: '1px solid #EAEAEA',
                                borderRadius: 10,
                                padding: 24,
                            }}
                        >
                            <Typography.Text style={{ fontSize: 16, fontWeight: 600, color: '#000' }}>
                                Passenger {p.id}
                            </Typography.Text>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                                <InfoCol label="Name" value={p.name} />
                                <InfoCol label={p.idType || 'ID Number'} value={p.idNumber} />
                                <InfoCol label="Seat" value={p.seat} />
                                <InfoCol label="Email" value={p.email} />
                            </div>
                        </Flex>
                    ))}
                </Flex>
            )}
        </Flex>
    );
}
