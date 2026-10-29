import React from 'react';

import { Typography, Image, Flex, Col } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import visaIcon from '@src/domains/dashboard/Invoice/assets/images/visa.svg';

type PricingTablePropsType = {
    commissionFlatAmount: number;
    uaeCardsCharge: number;
    internationalCardsCharge: number;
};
const { Text } = Typography;

const PricingTable = ({
    commissionFlatAmount = 0,
    uaeCardsCharge = 0,
    internationalCardsCharge = 0,
}: PricingTablePropsType) => {
    const columns = [
        {
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text className="whitespace-nowrap">Cards</Text>
                    <Image src={visaIcon} alt="Visa" height="25px" />
                </div>
            ),
            dataIndex: 'cards',
            key: 'cards',
        },
        {
            title: 'Transaction fee',
            dataIndex: 'transactionFee',
            key: 'transactionFee',
            render: (text: any) => <Text className="whitespace-nowrap">{text}</Text>,
        },
        {
            title: 'Settlement',
            dataIndex: 'settlement',
            key: 'settlement',
        },
    ];

    const dataSource = [
        {
            key: '1',
            cards: 'Transaction fee on UAE cards',
            transactionFee: `${uaeCardsCharge}% + ${commissionFlatAmount} ₹`,
            settlement: 'Weekly',
        },
        {
            key: '2',
            cards: 'Transaction fee on international cards',
            transactionFee: `${internationalCardsCharge}% + ${commissionFlatAmount} ₹`,
            settlement: 'Weekly',
        },
    ];

    return (
        <Flex vertical className="w-full mt-8" align="center" justify="center">
            <Col>
                <Text style={{ textAlign: 'center' }} className="font-semibold text-[1.1rem]">
                    Pricing for payment links
                </Text>
            </Col>
            <GenericTable
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                bordered
                style={{ borderRadius: '8px', marginTop: '5px' }}
                className="w-2/3"
            />
        </Flex>
    );
};
export default React.memo(PricingTable);
