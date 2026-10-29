import React from 'react';

import { CardProps } from '@domains/dashboard/Subscriptions/types/types';
import OfferCard from '@src/domains/dashboard/Subscriptions/components/SubscriptionListing/OfferCard';
import OfferLessCard from '@src/domains/dashboard/Subscriptions/components/SubscriptionListing/OfferLessCard';

const SubscriptionCard: React.FC<CardProps> = ({ title, description, image, discount, id }) =>
    discount !== '' ? (
        <OfferCard
            title={title}
            description={description}
            discount={discount}
            image={image}
            id={id}
        />
    ) : (
        <OfferLessCard
            title={title}
            description={description}
            image={image}
            discount={discount}
            id={id}
        />
    );

export default SubscriptionCard;
