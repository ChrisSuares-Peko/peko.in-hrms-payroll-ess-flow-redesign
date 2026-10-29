import React from 'react';

import { Row, Card, Flex, Image, Typography } from 'antd';

const { Text } = Typography;
interface optionsProps {
    optionName: string;
    image: string;
    walletAmount?: number | string;
    checked?: boolean;
    handleSelection: () => void;
}

const PaymentOptions = ({
    optionName,
    walletAmount,
    image,
    checked,
    handleSelection,
}: optionsProps) => (
    <Card
        size="small"
        onClick={handleSelection}
        bordered={false}
        className={`rounded-xl border border-solid p-4 cursor-pointer  ${checked ? 'border-bgOrange2' : 'border-borderGray'}`}
    >
        <Flex gap={20} justify="space-between" align="center">
            <Row className="bg-slate-90 min-h-7 items-center gap-2 sm:gap-5">
                <Text>{optionName}</Text>
                {walletAmount && (
                    <Text strong className="tracking-widest text-textGreen">
                        ₹ {walletAmount}
                    </Text>
                )}
            </Row>
            <Image
                src={image}
                alt="logo"
                width={125}
                className="bg-transparent"
                style={{ height: 'auto' }}
                preview={false}
            />
        </Flex>
    </Card>
);

export default PaymentOptions;
