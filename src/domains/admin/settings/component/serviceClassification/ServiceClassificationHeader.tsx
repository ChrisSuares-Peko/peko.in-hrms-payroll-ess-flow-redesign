import { Alert, Flex, Typography } from 'antd';

import { ServiceClassificationTab } from '../../types/serviceClassification';
import { CLASSIFICATION_LABELS } from '../../utils/serviceClassification';

export const SERVICE_CLASSIFICATION_INTRO =
    'Mark each service operator as a vendor service with plans, a vendor service without plans, one of Peko’s own service subscriptions, or a vendor providing a Peko subscription, so the Accounting portal knows what has to be configured, and for vendor services approved, before corporates see it. Leave a service unclassified if it is not a payment service.';

export const CLASSIFICATION_RULES: {
    key: ServiceClassificationTab;
    title: string;
    text: string;
}[] = [
    {
        key: 'with_plans',
        title: CLASSIFICATION_LABELS.with_plans,
        text: 'A vendor’s service sold as several items — plans, packages or catalogue entries listed under Manage (for example eSIM plans, work plans, gift cards, software subscriptions) or under Service Packages. Commission is configured per item.',
    },
    {
        key: 'without_plans',
        title: CLASSIFICATION_LABELS.without_plans,
        text: 'A vendor’s service set up only on its service operator, with one commission for the whole service.',
    },
    {
        key: 'peko_subscription',
        title: CLASSIFICATION_LABELS.peko_subscription,
        text: 'A service Peko runs itself and sells as service packages, one or more plans each, such as Peko Commerce. There is no vendor and no commission: its packages are priced under Peko Subscriptions in the Accounting portal, and it needs no accounting approval.',
    },
    {
        key: 'peko_subscription_vendor',
        title: CLASSIFICATION_LABELS.peko_subscription_vendor,
        text: 'A vendor Peko works with behind one of its own subscriptions. Classifying the service puts its vendor on the Vendors list of the Accounting portal, so the accounts team can record deposits, commissions, credit notes, cost of sales and debit notes for it. There is no commission on the service, its orders stay off the vendor ledger, and it needs no accounting approval.',
    },
];

export const PAYMENT_ONLY_TITLE = 'Payment services only';
export const PAYMENT_ONLY_TEXT =
    'This list exists for accounting: it decides which vendor services must have their platform fee, commission and cashback configured, and pass accounting approval, before corporates can use them, which of Peko’s own services are priced under Peko Subscriptions, and which vendors behind those subscriptions are listed under Vendors. Do not classify a service that never takes a payment — verification, information or free tools stay unclassified and are never hidden from corporates.';

const ServiceClassificationHeader = () => (
    <Flex vertical gap={10} className="rounded-xl border border-solid border-borderCard px-5 py-4">
        <Typography.Text className="text-[13px] text-textBody">
            {SERVICE_CLASSIFICATION_INTRO}
        </Typography.Text>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5">
            {CLASSIFICATION_RULES.map(rule => (
                <li key={rule.key} className="text-[13px] text-textBody">
                    <Typography.Text strong className="text-textHeadings">
                        {rule.title}
                    </Typography.Text>
                    {` — ${rule.text}`}
                </li>
            ))}
        </ul>
        <Alert
            type="warning"
            showIcon
            message={<Typography.Text strong>{PAYMENT_ONLY_TITLE}</Typography.Text>}
            description={PAYMENT_ONLY_TEXT}
            className="rounded-lg"
        />
    </Flex>
);

export default ServiceClassificationHeader;
