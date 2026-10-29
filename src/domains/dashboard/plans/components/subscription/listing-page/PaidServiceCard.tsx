import React from 'react';

import { Col, Flex, Image, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

interface IconCardProps {
    icon: string;
    title: string;
    price: string;
    isEqualSymbol?: boolean;
}

const { Text } = Typography;

const PaidServiceCard: React.FC<IconCardProps> = ({
    icon,
    title,
    price,
    isEqualSymbol = false,
}) => {
    const { sm, xs } = useScreenSize();
    return (
        <>
            <Col className="text-center gutter-row" xs={10} sm={6} md={8} lg={6} xl={3}>
                <Flex vertical gap={5} className="text-center">
                    <div
                        style={{ background: '#FFF9F9' }}
                        className="py-5 transition-transform duration-300 transform rounded-lg hover:scale-105 hover:shadow-lg"
                    >
                        <Image
                            src={icon}
                            preview={false}
                            className="w-full h-full max-h-[1.5rem] lg:max-h-[3.5rem] object-contain"
                        />
                    </div>
                    <Text className="flex items-center justify-center text-xs min-h-12 sm:text-sm">
                        {title}
                    </Text>
                    <Text className="text-xs font-medium">₹ {price || 0}</Text>
                </Flex>
            </Col>
            <Col className="gutter-row " span={1}>
                <Flex className="-mt-12" align="center" justify="center">
                    {!(isEqualSymbol && xs) && (
                        <Text className="text-4xl">{isEqualSymbol && sm ? '=' : '+'}</Text>
                    )}
                </Flex>
            </Col>
        </>
    );
};
export default PaidServiceCard;
