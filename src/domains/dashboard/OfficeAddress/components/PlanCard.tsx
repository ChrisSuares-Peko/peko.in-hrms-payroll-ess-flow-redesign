import { Typography, Card, Divider, Flex } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { PlanDetail } from '../types/index';

interface PlanCardProps {
    plan: PlanDetail;
}

const PlanCard = ({ plan }: PlanCardProps) => {
    const { name, highlights, price, description, billingCycle } = plan;

    const amount = formatNumberWithLocalString(parseInt(price, 10), 0, 0);
    const billingCycleFormated = billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly';

    let cost;
    if (billingCycle === 'MONTHLY') {
        cost = `Yearly cost you ₹ ${formatNumberWithLocalString(parseInt(price, 10) * 12)}`;
    } else {
        cost = `Monthly cost you ₹ ${formatNumberWithLocalString(parseInt(price, 10) / 12)}`;
    }

    return (
        <Card className="rounded-2xl">
            <Flex vertical>
                <Typography.Text className="text-xl md:text-2xl font-medium">
                    {name}
                </Typography.Text>

                <Typography.Paragraph className="font-normal text-base mt-5 ">
                    {description}
                </Typography.Paragraph>

                <Typography.Paragraph className=" text-2xl font-medium leading-10 tracking-tight text-left mt-5 mb-10">
                    {`₹ ${amount}`}{' '}
                    <span className=" text-base font-light">{billingCycleFormated}</span>
                </Typography.Paragraph>

                <Typography.Paragraph className="text-gray-400 mt-2">{cost}</Typography.Paragraph>

                <Typography.Paragraph
                    style={{ whiteSpace: 'pre-wrap' }}
                    className=" text-sm font-light mt-6"
                >
                    {highlights}
                </Typography.Paragraph>

                <Divider style={{ border: 'none' }} className="mt-15" />
            </Flex>
        </Card>
    );
};

export default PlanCard;
