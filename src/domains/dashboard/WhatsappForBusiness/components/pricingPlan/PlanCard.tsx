import { Flex, Radio, Typography } from 'antd';

import { calculateDiscount } from '@src/domains/dashboard/plans/utils';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ListPoints from './ListPoints';
import { PlanMode, PlanType } from '../../types';

type Props = {
    planId: number;
    feature: string[];
    benefits?: string[];
    planName: PlanMode;
    price: number;
    discount: number;
    selectedType: PlanMode;
    onSelectPlan: (plan: PlanMode, planId: number, price: number, discountedAmount: number) => void;
    seletedDuration: PlanType;
    shouldSkip?: boolean; // Optional shouldSkip prop
};

const PlanCard = ({
    planId,
    price,
    planName,
    feature,
    benefits,
    selectedType,
    discount,
    onSelectPlan,
    seletedDuration,
    shouldSkip,
}: Props) => {
    const { discountedAmount, discountPercentage } = calculateDiscount(price, discount);
    const { Text } = Typography;

    const durationLabel = seletedDuration === 'monthly' ? '/month' : '/year';

    const handleSelectPlan = () => {
        if (!shouldSkip) {
            onSelectPlan(planName, planId, price, discountedAmount);
        }
    };

    return (
        <Flex key={planId} className="pt-3" justify="center" align="center">
            <Flex
                className={`flex-col h-full pb-5 w-80 shadow-[0_0_20px_rgba(0,0,0,0.1)] transition duration-150 transform hover:scale-105 border rounded-2xl shadow-xl cursor-pointer ${
                    selectedType === planName ? 'border-brandColor' : 'border-gray-200'
                }`}
                align="stretch"
                style={{ minHeight: '500px' }}
                onClick={handleSelectPlan} // Add onClick here
            >
                <Flex
                    className="flex-col flex-grow gap-4 px-8 py-6 w-full"
                    align="start"
                    justify="start"
                >
                    <Flex className="flex-col flex-grow gap-4 w-full">
                        <Flex vertical align="flex-start" justify="center">
                            <Flex
                                justify={discountPercentage > 0 ? 'space-between' : 'end'}
                                className="w-full"
                            >
                                {discountPercentage > 0 && (
                                    <Text
                                        className="px-4 py-1 text-[#363835] rounded-2xl bg-[#DBFFC5]"
                                        style={{ fontSize: '11px', width: 'auto' }}
                                    >
                                        Save up to{' '}
                                        {formatNumberWithLocalString(discountPercentage, 0, 0)}%
                                    </Text>
                                )}
                                <Radio.Group
                                    value={selectedType}
                                    onChange={handleSelectPlan}
                                    className="w-fit"
                                >
                                    <Radio
                                        value={planName}
                                        style={{ fontSize: '16px' }}
                                        disabled={shouldSkip}
                                    />
                                </Radio.Group>
                            </Flex>
                            <Typography.Text
                                className="font-medium mt-2 text-brandColor"
                                style={{ fontSize: '16px' }}
                            >
                                {planName === 'WhatsApp Basic' ? 'Basic' : 'Pro'}
                            </Typography.Text>
                            <Typography.Text className="text-3xl font-medium mt-3">
                                {price === 0 ? `` : `₹ `}
                                <Typography.Text className="text-3xl font-medium">
                                    {price === 0
                                        ? `Free`
                                        : `${formatNumberWithLocalString(discountedAmount, 0)} `}
                                </Typography.Text>
                                <Typography.Text
                                    className="text-[#242424] font-normal"
                                    style={{ fontSize: '18px' }}
                                >
                                    {durationLabel}
                                </Typography.Text>
                            </Typography.Text>
                        </Flex>
                        <ListPoints
                            shouldSkip={shouldSkip}
                            itemsWithTicks={feature}
                            itemsWithoutTicks={benefits}
                        />
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PlanCard;
