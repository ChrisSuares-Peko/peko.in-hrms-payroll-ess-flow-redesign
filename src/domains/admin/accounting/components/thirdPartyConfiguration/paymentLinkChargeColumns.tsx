import { ReactNode } from 'react';

import { Flex, Typography } from 'antd';

import { GenericColumns } from '@components/atomic/GenericTable';

import {
    ChargeSource,
    PaymentLinkChargeRow,
    PaymentLinkOnboardingStatus,
    ThirdPartyConfigurationTab,
} from '../../types/thirdPartyConfiguration';
import { PillMeta } from '../../utils/commission';
import { describeCharge } from '../../utils/paymentLinkCharge';
import StatusPill from '../common/StatusPill';
import { formatDate } from '../ledgers/vendorColumns';

export const THIRD_PARTY_CONFIGURATION_TAB_COPY: Record<
    ThirdPartyConfigurationTab,
    { title: string; intro: string }
> = {
    'payment-links': {
        title: 'Payment Links',
        intro: 'The charge Peko takes on each payment link collection, corporate by corporate. Every corporate onboarded for payment links follows the default charge unless a custom charge has been recorded for it here.',
    },
};

export const DEFAULT_CHARGE_CARD_TITLE = 'Default charge';

export const CHARGE_FORM_LABELS = {
    percentage: 'Charge (%)',
    fixed: 'Charge per transaction (₹)',
} as const;

export const ONBOARDING_PILLS: Record<PaymentLinkOnboardingStatus, PillMeta> = {
    active: { label: 'Active', tone: 'success' },
    pending: { label: 'Pending', tone: 'warning' },
    'approval-pending': { label: 'Approval pending', tone: 'warning' },
    on_hold: { label: 'On hold', tone: 'neutral' },
    suspended: { label: 'Suspended', tone: 'neutral' },
    rejected: { label: 'Rejected', tone: 'danger' },
};

export const SOURCE_PILLS: Record<ChargeSource, PillMeta> = {
    custom: { label: 'Custom', tone: 'warning' },
    default: { label: 'Default', tone: 'neutral' },
    none: { label: 'Not set', tone: 'danger' },
};

const PROVIDER_LABELS: Record<string, string> = { nupay: 'NuPay', decentro: 'Decentro' };

export const providerLabel = (provider: string | null | undefined) =>
    provider ? (PROVIDER_LABELS[provider.toLowerCase()] ?? provider) : '—';

const twoLines = (main: string | null, detail: string | null) => (
    <Flex vertical>
        <Typography.Text className="font-medium text-textHeadings">{main || '—'}</Typography.Text>
        {detail ? (
            <Typography.Text className="text-xs text-textBody">{detail}</Typography.Text>
        ) : null}
    </Flex>
);

export const chargeCell = (row: PaymentLinkChargeRow) =>
    describeCharge(row.effective) ?? (
        <Typography.Text className="text-amber-600">Not set</Typography.Text>
    );

export const paymentLinkChargeColumns = (
    renderActions?: (row: PaymentLinkChargeRow) => ReactNode
): GenericColumns<PaymentLinkChargeRow> => [
    {
        title: 'Corporate',
        key: 'corporate',
        dataIndex: 'corporate',
        sorter: true,
        width: 220,
        render: (_, row) => twoLines(row.corporate.name, row.corporate.username),
    },
    {
        title: 'Onboarding',
        key: 'status',
        dataIndex: 'status',
        sorter: true,
        width: 150,
        render: (_, row) =>
            row.onboarding ? (
                <StatusPill
                    {...(ONBOARDING_PILLS[row.onboarding.status] ?? {
                        label: row.onboarding.status,
                        tone: 'neutral',
                    })}
                />
            ) : (
                '—'
            ),
    },
    {
        title: 'Provider',
        key: 'provider',
        width: 110,
        render: (_, row) => providerLabel(row.onboarding?.provider),
    },
    { title: 'Charge', key: 'charge', width: 170, render: (_, row) => chargeCell(row) },
    {
        title: 'Source',
        key: 'source',
        width: 110,
        render: (_, row) => <StatusPill {...SOURCE_PILLS[row.effective.source]} />,
    },
    {
        title: 'Last Set',
        key: 'updatedAt',
        dataIndex: 'updatedAt',
        sorter: true,
        width: 190,
        render: (_, row) =>
            row.charge
                ? twoLines(
                      formatDate(row.charge.updatedAt ?? ''),
                      row.charge.recordedByName ? `by ${row.charge.recordedByName}` : null
                  )
                : '—',
    },
    ...(renderActions
        ? [
              {
                  title: 'Actions',
                  key: 'actions',
                  width: 230,
                  neverFold: true,
                  render: (_: unknown, row: PaymentLinkChargeRow) => renderActions(row),
              },
          ]
        : []),
];
