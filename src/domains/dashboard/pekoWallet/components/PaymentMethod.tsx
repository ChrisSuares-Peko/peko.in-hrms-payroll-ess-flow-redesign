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
        className={`w-full py-3 px-1 border border-solid cursor-pointer rounded-xl ${checked && 'border-bgOrange2'}`}
        onClick={handleClick}
    >
        <Flex gap={20} align="center" justify="space-between flex-wrap sm:flex-nowrap">
            <Row className="items-center gap-2 bg-slate-90 sm:gap-2">
                <Typography.Text className="text-xs sm:text-[13px]">{label}</Typography.Text>
            </Row>
            <Flex align="center" justify="center" className="w-1/4 h-5 ">
                <Image
                    src={icon}
                    alt="logo"
                    // height={20}
                    width={80}
                    className="bg-transparent "
                    preview={false}
                />
            </Flex>
        </Flex>
    </Card>
);

export default PaymentMethod;
