import React from 'react';

import { Col, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

const { Text } = Typography;

type ServiceCardProps = {
    title: string;
    icon: string;
    bgColor: string;
    contentColor: string;
};

const ServiceCard = ({ bgColor, title, icon, contentColor }: ServiceCardProps) => {
    const style: React.CSSProperties = {
        background: bgColor,
        padding: '8px 0',
        color: contentColor,
    };

    return (
        <Col className="gutter-row xs:w-1/2 sm:w-1/3 lg:w-1/4 xl:w-1/4 xxl:w-1/5">
            <div
                style={style}
                className="rounded-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            >
                <Flex align="center" justify="center" vertical gap={10} className="py-1">
                    <ReactSVG data-testid="icon-svg" src={icon} />
                    <Text
                        style={{ color: contentColor }}
                        className="text-center text-xs sm:text-base px-2 sm:px-0"
                    >
                        {title}
                    </Text>
                </Flex>
            </div>
        </Col>
    );
};

export default ServiceCard;
