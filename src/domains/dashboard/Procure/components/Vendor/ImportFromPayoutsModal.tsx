import React, { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal, Tag, Typography } from 'antd';

const { Text } = Typography;

type PayoutVendor = {
    id: number;
    name:  string;
    email: string;
    tags:  string[];
};

const payoutVendors: PayoutVendor[] = [
    { id: 1, name: 'Etisalat Enterprise UAE',  email: 'nasser@etisalat-ent.ae',  tags: ['IT', 'Services'] },
    { id: 2, name: 'Emirates NBD Corporate',   email: 'corp@emiratesnbd.ae',      tags: ['Finance'] },
    { id: 3, name: 'Triton IT Solutions',       email: 'procurement@triton-it.ae', tags: ['IT'] },
    { id: 4, name: 'Emitac Digital Solutions',  email: 'rfq@emitac.ae',            tags: ['IT', 'Facilities'] },
    { id: 5, name: 'Al Futtaim Logistics LLC',  email: 'tariq@alfuttaim-log.ae',   tags: ['Logistics'] },
];

type Props = {
    open:    boolean;
    onClose: () => void;
};

const ImportFromPayoutsModal: React.FC<Props> = ({ open, onClose }) => {
    const [selected, setSelected] = useState<number[]>([]);

    const toggle = (id: number) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleImport = () => {
        console.log('Import vendors:', selected);
        setSelected([]);
        onClose();
    };

    const handleCancel = () => {
        setSelected([]);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            title={<Text strong style={{ fontSize: 16 }}>Import from Peko Payouts</Text>}
            footer={null}
            width={500}
            styles={{ body: { paddingTop: 8 } }}
        >
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                Select vendors from your Peko Payouts account to import:
            </Text>

            <Flex vertical gap={8} style={{ maxHeight: 320, overflowY: 'auto' }}>
                {payoutVendors.map(v => {
                    const isSelected = selected.includes(v.id);
                    return (
                        <Flex
                            key={v.id}
                            align="center"
                            gap={12}
                            onClick={() => toggle(v.id)}
                            style={{
                                border: `1px solid ${isSelected ? '#ff4d4f' : '#f0f0f0'}`,
                                borderRadius: 8,
                                padding: '10px 14px',
                                cursor: 'pointer',
                                background: isSelected ? '#fff1f0' : '#fff',
                                transition: 'all 0.15s',
                            }}
                        >
                            <Checkbox checked={isSelected} onChange={() => toggle(v.id)} onClick={e => e.stopPropagation()} />
                            <Flex vertical gap={2} style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: 13 }}>{v.name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{v.email}</Text>
                            </Flex>
                            <Flex gap={4}>
                                {v.tags.map(tag => (
                                    <Tag
                                        key={tag}
                                        style={{
                                            borderRadius: 6,
                                            fontSize: 11,
                                            padding: '0 8px',
                                            margin: 0,
                                            color: '#595959',
                                            background: '#fafafa',
                                            border: '1px solid #d9d9d9',
                                        }}
                                    >
                                        {tag}
                                    </Tag>
                                ))}
                            </Flex>
                            {isSelected && <CheckCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />}
                        </Flex>
                    );
                })}
            </Flex>

            <Flex gap={12} style={{ marginTop: 24 }}>
                <Button
                    type="primary"
                    danger
                    style={{ borderRadius: 8, flex: 1 }}
                    onClick={handleImport}
                    disabled={selected.length === 0}
                >
                    Import Selected ({selected.length})
                </Button>
                <Button style={{ borderRadius: 8, flex: 1 }} onClick={handleCancel}>
                    Cancel
                </Button>
            </Flex>
        </Modal>
    );
};

export default ImportFromPayoutsModal;
