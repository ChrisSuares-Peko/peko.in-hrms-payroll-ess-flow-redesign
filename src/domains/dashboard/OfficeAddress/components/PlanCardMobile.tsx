import { Typography, Card, Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { PlanDetail } from '../types/index';

interface PlanCardMobileProps {
    plan: PlanDetail;
    hideBtn?: boolean;
}

const planName = (value: string) => {
    if (value.includes('Flexi Plan')) return 'flexi';
    if (value.includes('Premium Plan')) return 'premium';
    if (value.includes('Basic Plan')) return 'basic';
    return 'plans';
};

const PlanCardMobile = ({ plan, hideBtn = false }: PlanCardMobileProps) => {
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
        <Card
            className="flex justify-between h-full py-3 rounded-2xl _scale_on_hover"
            styles={{ body: { width: '100%' } }}
        >
            <Flex className="w-full" gap={10} vertical>
                <Typography.Text className="text-base font-medium text-center sm:text-start sm:text-xl md:text-2xl">
                    {name}
                </Typography.Text>

                <Typography.Text className="text-2xl font-medium text-center">
                    {`₹ ${Number(price).toLocaleString()}`}{' '}
                    <span className="text-base font-light ">
                        {billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                    </span>
                </Typography.Text>

                <Typography.Text className="text-center text-gray-400">{cost}</Typography.Text>

                <Typography.Paragraph className="mt-3 text-base font-normal">
                    {description}
                </Typography.Paragraph>

                <Typography.Paragraph
                    className="mt-3 text-sm font-light leading-4"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    {highlights}
                </Typography.Paragraph>

                {!hideBtn && (
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
                )}
            </Flex>
        </Card>
    );
};

export default PlanCardMobile;
