import { Col, Flex, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import bankIcon from '../assets/svg/challanBank.svg';
import clockIcon from '../assets/svg/challanClock.svg';
import documentIcon from '../assets/svg/challanDocument.svg';
import moneySendIcon from '../assets/svg/challanMoneySend.svg';
import { ChallanSummary } from '../types/index';

const { Text } = Typography;

interface Props {
    summary: ChallanSummary;
}

const ChallanSummaryCards = ({ summary }: Props) => {
    const cards = [
        {
            label: 'Total Outstanding',
            value: `₹ ${formatNumberWithLocalString(summary.totalOutstanding)}`,
            icon: clockIcon,
            iconSize: 20,
            bg: '#FDF6F0',
        },
        {
            label: 'Pending',
            value: `${summary.pending}`,
            icon: documentIcon,
            iconSize: 21,
            bg: '#ECF0FC',
        },
        {
            label: 'Paid',
            value: `${summary.paid}`,
            icon: moneySendIcon,
            iconSize: 20,
            bg: '#EBF6F1',
        },
        {
            label: 'Court Matters',
            value: `${summary.courtMatters}`,
            icon: bankIcon,
            iconSize: 24,
            bg: '#FCF9FF',
        },
    ];

    return (
        <Row gutter={[24, 24]} className="w-full">
            {cards.map(card => (
                <Col xs={24} sm={12} lg={6} key={card.label}>
                    <Flex
                        vertical
                        gap={14}
                        justify="center"
                        className="h-full rounded-2xl px-7 py-[18px]"
                        style={{ backgroundColor: card.bg }}
                    >
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-full bg-white"
                            style={{ width: 40, height: 40 }}
                        >
                            <img
                                src={card.icon}
                                alt=""
                                style={{ width: card.iconSize, height: card.iconSize }}
                            />
                        </Flex>
                        <Flex vertical gap={4}>
                            <Text className="text-2xl font-semibold text-[#1E293B]">
                                {card.value}
                            </Text>
                            <Text className="text-base text-[#475569]">{card.label}</Text>
                        </Flex>
                    </Flex>
                </Col>
            ))}
        </Row>
    );
};

export default ChallanSummaryCards;
