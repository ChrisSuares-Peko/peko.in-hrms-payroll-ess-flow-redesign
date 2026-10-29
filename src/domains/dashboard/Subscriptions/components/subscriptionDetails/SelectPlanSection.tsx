import '@domains/dashboard/Subscriptions/assets/styles/styles.css';

import PlanOfferCard from '@domains/dashboard/Subscriptions/components/subscriptionDetails/PlanOfferCard';
import PlanOfferLessCard from '@domains/dashboard/Subscriptions/components/subscriptionDetails/PlanOfferLessCard';
import { AddressCardProps } from '@domains/dashboard/Subscriptions/types/types';

const SelectPlanSection = ({
    title,
    period,
    amount,
    monthlyCost,
    offer,
    features,
    id,
    noOfUser,
}: AddressCardProps) =>
    offer ? (
        <PlanOfferCard
            title={title}
            period={period}
            amount={amount}
            monthlyCost={monthlyCost}
            offer={offer}
            features={features}
            id={id}
            noOfUser={noOfUser}
        />
    ) : (
        <PlanOfferLessCard
            title={title}
            period={period}
            amount={amount}
            monthlyCost={monthlyCost}
            features={features}
            id={id}
            noOfUser={noOfUser}
        />
    );

export default SelectPlanSection;
