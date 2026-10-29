import type { FC } from 'react';

// import SubscriptionPage from '@domains/dashboard/IndividualPlan/pages/SubscriptionPage';
// import { CollectorFeatures, serviceDetails, subDescription } from '@domains/dashboard/Invoice/utils/features';
// import { accessKeys } from '@utils/accessKeys';
// import { packageAccessKeys } from '@utils/packageAccessKeys';

import Dashboard from './Dashboard';

// Wraps the Invoicing dashboard in the shared individual-plan SubscriptionPage so basic/free and
// not-purchased users see the individual package (purchase UI / upgrade CTA), mirroring eSign,
// Turbo and Payroll. Key = eInvoice ('alankit_einvoice'), matching the Invoicing row in the plans
// comparison table; if the package's actual serviceAccessKey is 'invoices', swap both props to
// accessKeys.invoices / packageAccessKeys-equivalent.
// Subscription check temporarily disabled — eInvoice dashboard renders directly.
const LandingPage: FC = () => (
    // <SubscriptionPage
    //     serviceName="Invoicing"
    //     title="Invoice smarter, get paid faster, and stay on top of every | receivable. One platform for all your account receivables"
    //     serviceDetails={serviceDetails}
    //     subDescription={subDescription}
    //     accessCode={packageAccessKeys.eInvoice}
    //     serviceAccessKey={accessKeys.eInvoice}
    //     features={CollectorFeatures}
    // >
    //     <Dashboard />
    // </SubscriptionPage>
    <Dashboard />
);

export default LandingPage;
