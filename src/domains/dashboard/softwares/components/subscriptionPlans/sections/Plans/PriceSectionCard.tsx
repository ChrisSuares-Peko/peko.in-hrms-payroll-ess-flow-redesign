import { Typography, Button, Flex } from 'antd';

import { useSubscriptionContext } from '@src/domains/dashboard/softwares/contexts/SubscriptionPageContext';
import useGetAssistance from '@src/domains/dashboard/softwares/hooks/general/useGetAssistance';
import { IPlan, IPricingOption, IPurchaseOption } from '@src/domains/dashboard/softwares/types';

const { Text } = Typography;

type Props = {
    purchaseOption: IPurchaseOption;
    productName: string;
    weburl: string;
    pricingOption: IPricingOption;
    company: string;
};

const PriceSectionCard = ({
    purchaseOption,
    productName,
    weburl,
    pricingOption,
    company,
}: Props) => {
    const { handleSoftwareSubmission } = useSubscriptionContext();
    const { isLoading, requestAssistance } = useGetAssistance();
    const hasDiscount = Number(pricingOption.discountPercentage) > 0;
    const payableAmount = hasDiscount
        ? Number(pricingOption.discountedAmountInConvertedCurrency)
        : Number(pricingOption.amountInConvertedCurrency);

    const {
        amount,
        billingCycle,
        currency,
        discountedAmount,
        discountedAmountInConvertedCurrency,
        discountPercentage,
    } = pricingOption;

    const submissionPayload: IPlan = {
        planName: purchaseOption.plan.name,
        productName,
        skuCode: purchaseOption.sku.code,
        webUrl: weburl,
        pricingDetails: {
            amount,
            billingCycle,
            currency,
            discountedAmount,
            discountedAmountInConvertedCurrency,
            discountPercentage,
        },
    };

    return (
        <Flex vertical className="gap-4">
            <Flex className="justify-between">
                <Text className="font-semibold text-lg text-navTextColor">
                    {purchaseOption.plan.name}
                </Text>
                {Number(pricingOption.discountPercentage) > 0 && (
                    <Flex className="text-[#43B75D] text-sm  font-semibold px-4 py-1 rounded-md bg-[#ECFDF5]">
                        Save {pricingOption.discountPercentage}%
                    </Flex>
                )}
            </Flex>
            <Flex className="items-baseline gap-5 flex-wrap mt-5">
                {hasDiscount && (
                    <Text className="font-semibold text-lg text-textGreyColor relative">
                        <span className="relative">
                            <span className="absolute inset-0 flex items-center">
                                <span className="w-full h-[1.5px] bg-lightRed" />
                            </span>
                            ₹ {pricingOption.amountInConvertedCurrency}
                        </span>
                    </Text>
                )}
                <Text className="font-semibold text-4xl text-black">
                    ₹ {payableAmount}
                    <span className="font-regular text-sm text-navTextColor">
                        {' '}
                        /{pricingOption.ratePeriod.split('_').join(' ')}
                    </span>
                </Text>
            </Flex>
            <Button
                type="primary"
                danger
                block
                size="large"
                className="mt-5 rounded-xl h-11 font-medium"
                loading={isLoading}
                onClick={() => {
                    if (payableAmount > 0) {
                        handleSoftwareSubmission({
                            plan: submissionPayload,
                            company,
                            amount: String(payableAmount),
                        });
                    } else {
                        requestAssistance(weburl);
                    }
                }}
            >
                {payableAmount === 0 ? 'Request for Quote' : 'Select Plan'}
            </Button>
        </Flex>
    );
};

export default PriceSectionCard;
