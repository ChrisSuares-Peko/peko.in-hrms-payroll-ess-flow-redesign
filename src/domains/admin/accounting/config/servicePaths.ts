import { paths } from '@src/routes/paths';

import { AccountingPlanType } from '../types/services';

export const ACCOUNTING_SERVICE_CATEGORY = 'Accounting';

export const ACCOUNTING_SERVICE_TABS = {
    plans: 'plans',
    commission: 'commission',
    platformFee: 'platform-fee',
    cashbacks: 'cashbacks',
    vendor: 'vendor',
} as const;

export type AccountingServiceTab =
    (typeof ACCOUNTING_SERVICE_TABS)[keyof typeof ACCOUNTING_SERVICE_TABS];

export const SERVICE_LEAF_BY_KIND: Record<
    AccountingPlanType,
    // label matches the backend permission catalog exactly (roleAndPermissions.js) — used only
    // for the sub.service === item.label access check in useAccountingNavData. displayLabel is
    // the only thing ever shown to the user, so renaming it needs no backend/DB change.
    { label: string; displayLabel: string; slug: string; defaultTab: AccountingServiceTab }
> = {
    without_plans: {
        label: 'Service without plans',
        displayLabel: 'Vendor service without plans',
        slug: paths.accountingAdmin.serviceWithoutPlans,
        defaultTab: ACCOUNTING_SERVICE_TABS.commission,
    },
    with_plans: {
        label: 'Service with plans',
        displayLabel: 'Vendor service with plans',
        slug: paths.accountingAdmin.serviceWithPlans,
        defaultTab: ACCOUNTING_SERVICE_TABS.plans,
    },
};

export const accountingLeafPath = (slug: string) => `${paths.systemUser.accounting}/${slug}`;

export const SERVICE_CLASSIFICATION_PATH = `${paths.systemUser.settings}/${paths.settingsAdmin.serviceClassification}`;

export const accountingServicePath = (
    kind: AccountingPlanType,
    accessKey: string,
    tab: AccountingServiceTab = SERVICE_LEAF_BY_KIND[kind].defaultTab
) =>
    `${accountingLeafPath(SERVICE_LEAF_BY_KIND[kind].slug)}/${encodeURIComponent(accessKey)}/${tab}`;

export const SERVICE_PARTNER_PARAM = 'partner';
