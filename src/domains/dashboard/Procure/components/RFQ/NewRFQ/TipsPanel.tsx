import React from 'react';

import {  Card, Flex, Typography } from 'antd';

import newRFQImage from '@src/domains/dashboard/Procure/assets/images/newRFQImage.svg';

const {  Text } = Typography;

const tips = [
    'Be specific about what you need. It helps vendors compare and quote more accurately.',
    'Vendors typically need 3-5 business days, so give them enough time to respond with a quality quote.',
    'Select at least 2-3 vendors. More competition means better pricing and faster turnaround.',
];

const steps = [
    'Vendors receive a unique link to submit their proposal.',
    'Proposals appear in your dashboard as they come in.',
    'Compare proposals side-by-side and accept the best one.',
];

const TipsPanel: React.FC = () => (
    <>
        <Card bordered={false} className="rounded-3xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            <Card
                className="mb-4 rounded-xl !bg-[#FAF9F6] !border-0"
                styles={{ body: { padding: '20px 16px', display: 'flex', justifyContent: 'center' } }}
            >
                <img src={newRFQImage} alt="tips" style={{ width: 160, opacity: 0.9 }} />
            </Card>
            <Text strong className="block !mb-1" style={{ fontWeight: 500, fontSize: 18 }}>Tips</Text>
            <Flex vertical gap={28} className="mb-4 mt-6">
                {tips.map((tip, i) => (
                    <Flex key={i} gap={10} align="flex-start">
                        <span className="shrink-0 w-[10px] h-[10px] rounded-full mt-1 block" style={{ background: '#ff4f4f' }} />
                        <Text style={{ fontSize: 14, color: '#7d7d7d', lineHeight: '22px' }}>{tip}</Text>
                    </Flex>
                ))}
            </Flex>
        </Card>

        <Card bordered={false} className="rounded-3xl" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            <Text strong className="block !mb-5" style={{ fontWeight: 500, fontSize:18 }}>
                What happens next?
            </Text>
            <Flex vertical gap={12} className="mt-6">
                {steps.map((step, i) => (
                    <Card
                        key={i}
                        size="small"
                        className="!rounded-[28px] !bg-[#faf9f6] !border-0"
                        styles={{ body: { padding: '30px 21px' } }}
                    >
                        <Flex gap={21} align="center">
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    flexShrink: 0,
                                    width: 47,
                                    height: 47,
                                    minWidth: 47,
                                    minHeight: 47,
                                    borderRadius: 23.5,
                                    background: '#fff',
                                    border: '1px solid #f0f0f0',
                                    fontWeight: 600,
                                    fontSize: 22,
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                            >
                                {i + 1}
                            </Flex>
                            <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.85)', lineHeight: '22px' }}>
                                {step}
                            </Text>
                        </Flex>
                    </Card>
                ))}
            </Flex>
        </Card>
    </>
);

export default TipsPanel;
