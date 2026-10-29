import { useEffect, useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { PreviousSubscription } from '@src/domains/dashboard/IndividualPlan/types';
import { calculateDiscount } from '@src/domains/dashboard/plans/utils';
import { paths } from '@src/routes/paths';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import styles from './styles.module.css';
import { useBotBuilderAmount } from '../../hooks/useBotBuilderAmount';
import { useGetActiveBotBuilder } from '../../hooks/useGetActiveBotBuilder';
import { useGetActiveSubscription } from '../../hooks/useGetActiveSubscription';
import { useGetDetailsSubscription } from '../../hooks/useGetDetailsSubscription';
import useWhatsAppSubscriptionPayment from '../../hooks/useSubscriptionPayment';

type Props = {
    children: any;
    subscriptionDetails: {
        isPurchased: boolean;
        previousSubscription: PreviousSubscription | null;
    };
    shouldBlockActions?: boolean;
    setIsExpired?: (value: boolean) => void;
};

const RenewalOverlay = ({
    children,
    subscriptionDetails,
    shouldBlockActions = true,
    setIsExpired,
}: Props) => {
    const serviceKey = packageAccessKeys['Whatsapp for Business'];
    const { data, isLoading } = useGetActiveSubscription(true);
    const {
        packages,
        deduction,
        isLoading: packageLoading,
    } = useGetDetailsSubscription({ accessKey: serviceKey });
    const {
        data: botbuilderData,
        isLoading: builderLoading,
    } = useGetActiveBotBuilder(true);
    const { handleSubmission: handleSubscription } = useWhatsAppSubscriptionPayment();
    const { data: amountData, isLoading: Loading } = useBotBuilderAmount();
    const [buttonLoading, setButtonLoading] = useState(false);
    const [botBuilderValue, setBotBuilderValue] = useState<number>(0);
    const container = document.getElementById('myContainer');
    const footerContainer = document.getElementById('footer-container');
    const breadcrumb = document.getElementById('custom-breadcrumb');
    const handlePurchasePlan = async () => {
        setButtonLoading(true);

        const packageId = data?.activeSubscriptions?.package?.id;
        const billingType = data?.activeSubscriptions?.billingType?.toLowerCase() as
            | 'monthly'
            | 'annually';

        const selectedPackage = packages?.find(pkg => pkg.id === packageId);
        if (!selectedPackage || !billingType || !selectedPackage.packagePrices[billingType]) {
            setButtonLoading(false);
            return;
        }

        // Get the subscription price and discount based on the billing plan
        const subscriptionPrice =
            parseFloat(selectedPackage.packagePrices[billingType].toString()) || 0;
        const discount = parseFloat(selectedPackage.discount[billingType].toString()) || 0;

        // Calculate the discounted amount
        const { discountedAmount } = calculateDiscount(subscriptionPrice, discount);

        const details = {
            url: `${paths.dashboard.moreServices}/${paths.whatsappForBusiness.index}`,
            service: 'WhatsApp For Business',
        };

        sessionStorage.setItem('PurchaseUrl', JSON.stringify(details));

        let updatedBotBuilderValue = botBuilderValue;

        if (botBuilderValue === 0 && botbuilderData?.activeSubscriptions && amountData) {
            if (botbuilderData?.activeSubscriptions?.billingType === 'MONTHLY') {
                updatedBotBuilderValue = amountData.amount;
            } else {
                updatedBotBuilderValue = amountData.yearlyAmount;
            }
            setBotBuilderValue(updatedBotBuilderValue);
        }

        await handleSubscription(
            data?.activeSubscriptions?.billingPlan!,
            data?.activeSubscriptions?.billingType!,
            data?.activeSubscriptions?.package?.id!,
            discountedAmount,
            updatedBotBuilderValue,
            data?.activeSubscriptions,
            deduction!,
            true
        );

        setButtonLoading(false);
    };

    const { isPurchased, previousSubscription } = subscriptionDetails;
    const isExpired = !isPurchased && previousSubscription;

    useEffect(() => {
        if (!footerContainer || !container) return () => {};

        if (isExpired) {
            container.classList.remove('sm:pt-8');
            container.classList.add('relative', 'xs:pt-32', 'sm:pt-16');

            if (shouldBlockActions) {
                container.classList.add('bg-[#f2f2f2]');
            }
            footerContainer.style.backgroundColor = '#f2f2f2';
            if (breadcrumb) {
                breadcrumb.style.backgroundColor = '#f2f2f2';
            }
            if (setIsExpired) {
                setIsExpired(true);
            }
        }
        return () => {
            if (isExpired) {
                container.classList.remove('relative', 'xs:pt-32', 'sm:pt-16', 'bg-[#f2f2f2]');
                container.classList.add('sm:pt-8');

                footerContainer.style.removeProperty('background-color');
                if (breadcrumb) {
                    breadcrumb.style.removeProperty('background-color');
                }
            }
        };
    }, [isExpired, container, footerContainer, breadcrumb, shouldBlockActions, setIsExpired]);

    if (isLoading || Loading || builderLoading || packageLoading) {
        return <Skeleton />;
    }

    return (
        <>
            {isExpired && (
                <Flex className="bg-[#F74C4C] px-5 py-2 gap-5 items-center mb-5 absolute left-0 top-0 w-full pt-">
                    <Typography.Text className="text-xs text-white">
                        Your auto-renewal payment could not be processed after multiple attempts.
                        Please complete your payment by clicking &#39;Pay Now&#39; to restore full
                        access to the WhatsApp for Business service.
                    </Typography.Text>

                    <Button
                        size="small"
                        className={`text-white border-white rounded-[4px] hover:bg-none ${styles.removeHoverBg}`}
                        onClick={handlePurchasePlan}
                        loading={buttonLoading}
                    >
                        Pay Now
                    </Button>
                </Flex>
            )}
            <Content className={`${isExpired && shouldBlockActions ? 'pointer-events-none' : ''}`}>
                {children}
            </Content>
        </>
    );
};

export default RenewalOverlay;
