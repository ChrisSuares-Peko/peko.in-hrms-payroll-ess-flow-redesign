import React from 'react';

import { Card, Flex, Typography } from 'antd';

import newRFQImage from '../../assets/images/newRFQImage.svg';
import { TIPS, STEPS } from '../../utils/data';

const { Text } = Typography;

const PRTipsPanel: React.FC = () => (
     <>
        <Card className="rounded-3xl border border-gray-100 mb-4" styles={{ body: { padding: 24 } }}>
            <Card
                className="mb-4 rounded-xl !bg-[#FAF9F6] !border-0"
                styles={{ body: { padding: '20px 16px', display: 'flex', justifyContent: 'center' } }}
            >
                <img src={newRFQImage} alt="tips" style={{ width: 160, opacity: 0.9 }} />
            </Card>
            <Text strong className="block !mb-1" style={{ fontWeight: 500, fontSize: 18 }}>Tips</Text>
            <Flex vertical gap={28} className="mb-4 mt-6">
                {TIPS.map((tip, i) => (
                    <Flex key={i} gap={10} align="flex-start">
                        <span className="shrink-0 w-[10px] h-[10px] rounded-full mt-1 block" style={{ background: '#ff4f4f' }} />
                        <Text style={{ fontSize: 14, color: '#7d7d7d', lineHeight: '22px' }}>{tip}</Text>
                    </Flex>
                ))}
            </Flex>
        </Card>

        <Card className="rounded-3xl border border-gray-100" styles={{ body: { padding: 24 } }}>
            <Text strong className="block !mb-5" style={{ fontWeight: 500, fontSize: 18 }}>
                What happens next?
            </Text>
            <Flex vertical gap={12} className="mt-6">
                {STEPS.map((step, i) => (
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

export default PRTipsPanel;
