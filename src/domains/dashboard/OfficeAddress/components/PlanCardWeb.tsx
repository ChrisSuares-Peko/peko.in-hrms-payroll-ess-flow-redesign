import { Typography, Card, Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { PlanDetail } from '../types/index';

import '../assets/style.css';

interface PlanCardWebProps {
    plan: PlanDetail;
    hideBtn?: boolean;
}

const planName = (value: string) => {
    if (value.includes('Flexi Plan')) return 'flexi';
    if (value.includes('Premium Plan')) return 'premium';
    if (value.includes('Basic Plan')) return 'basic';
    return 'plans';
};

const PlanCardWeb = ({ plan, hideBtn }: PlanCardWebProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { id, name, highlights, price, description, billingCycle, is_available } = plan;

    let cost;
    if (billingCycle === 'MONTHLY') {
        cost = (parseInt(price, 10) * 12).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        cost = `Yearly cost you ₹ ${cost}`;
    } else {
        cost = (parseInt(price, 10) / 12).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        cost = `Monthly cost you ₹ ${cost}`;
    }

    return (
        <Card className="flex justify-between h-full sm:p-3 sm:py-6 rounded-2xl _scale_on_hover">
            <Flex className="w-full h-full" gap={10} vertical>
                <Typography.Text className="h-8 overflow-hidden text-xl font-medium md:text-2xl line-clamp-1">
                    {name}
                </Typography.Text>

                <Typography.Paragraph className="h-10 overflow-hidden text-sm font-normal line-clamp-2">
                    {description}
                </Typography.Paragraph>

                <Typography.Text className="mt-2 text-lg font-medium sm:text-xl md:text-2xl">
                    {`₹ ${parseInt(price, 10).toLocaleString()}`}{' '}
                    <span className="text-base font-light ">
                        {billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                    </span>
                </Typography.Text>

                <Typography.Text className="text-gray-400">{cost}</Typography.Text>

                <Typography.Paragraph
                    className="overflow-hidden text-sm font-light leading-4 h-36 text-ellipsis"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    {highlights}
                </Typography.Paragraph>

                <Button
                    className="w-full mt-6 sm:w-3/4"
                    type="primary"
                    danger
                    onClick={() => {
                        if (!is_available) {
                            dispatch(
                                showToast({
                                    description:
                                        "Workspace currently unavailable. We'll notify you when it's accessible. Thank you.",
                                    variant: 'error',
                                })
                            );
                            return;
                        }
                        navigate(planName(name), { state: id });
                    }}
                >
                    Purchase
                </Button>
            </Flex>
        </Card>
    );
};

export default PlanCardWeb;
