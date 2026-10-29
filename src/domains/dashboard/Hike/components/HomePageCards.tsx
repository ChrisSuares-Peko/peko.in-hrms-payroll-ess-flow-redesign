import React from 'react';

import { Card, Flex, Image, Typography } from 'antd';

const { Paragraph } = Typography;

interface datas {
    amount: string;
    logo: any;
    features: any;
    partner: any;
    planType: string;
    length: number;
}

const HomePageCards = ({ amount, logo, features, partner, planType, length }: datas) => {
    const data = features?.split('\n').filter((item: any) => item.trim() !== '') || [];
    return (
        <Card className="relative flex justify-center h-full sm:p-3 sm:py-6 rounded-3xl _scale_on_hover">
            <Flex className="w-full h-full" gap={10} vertical>
                <Flex justify="center" align="center" className="min-h-16">
                    <Image
                        src={logo}
                        preview={false}
                        loading="lazy"
                        className="w-auto h-36"
                        // style={{ width: '100%', height: '100%', maxHeight: '9rem', minHeight: '9rem' }} // auto 24vh
                    />
                </Flex>

                <Paragraph className="mt-3 ml-2">
                    <ul style={{ paddingInlineStart: '0' }}>
                        {data.map((item: any, index: any) => (
                            <li key={index} style={{ marginBottom: '0.5em' }}>
                                {item}
                            </li>
                        ))}
                    </ul>
                </Paragraph>

                <Flex vertical gap={16}>
                    <Image
                        src={partner}
                        preview={false}
                        loading="lazy"
                        className="w-auto h-auto max-h-36"
                        // style={{ width: '100%', height: '100%', maxHeight: '9rem' }} // auto 24vh
                    />
                </Flex>
                <Paragraph className="mt-4 text-xl font-medium text-center ">
                    ₹ {amount} per user/{planType.toLowerCase()}
                </Paragraph>
            </Flex>
        </Card>
    );
};

export default HomePageCards;
