import React from 'react';

import { Card, Flex, Image, Row, Typography } from 'antd';

type PaymentMethodProps = {
    icon: string;
    checked: boolean;
    label: string;
    handleClick: () => void;
};

const PaymentMethod = ({ icon, checked, label, handleClick }: PaymentMethodProps) => (
    <Card
        size="small"
        bordered={false}
        className={`w-full p-3 border border-solid cursor-pointer rounded-xl ${checked && 'border-bgOrange2'}`}
        onClick={handleClick}
    >
        <Flex gap={22} align="center">
            <Flex align="center" justify="center" className="w-1/4 h-5">
                <Image
                    src={icon}
                    alt="logo"
                    height={40}
                    className="object-contain bg-transparent min-h-7 max-h-12 max-w-28"
                    preview={false}
                />
            </Flex>
            <Row className="items-center gap-2 bg-slate-90 sm:gap-5">
                <Typography.Text className="text-xs sm:text-sm">{label}</Typography.Text>
            </Row>
        </Flex>
    </Card>
);

export default PaymentMethod;
