import { describe, expect, it, vi } from 'vitest';

import {
    APPROVAL_GATE_CARD_TITLE,
    APPROVAL_KPI_CARDS,
    approvalColumns,
} from '../components/approvals/approvalColumns';
import {
    statementColumns,
    STATEMENT_CARD_LABELS,
} from '../components/ledgers/LedgerStatementPanel';
import { PARTNER_TAB_COPY, partnerTabColumns } from '../components/ledgers/partnerColumns';
import { PAYMENTS_CARD_LABELS } from '../components/ledgers/PartnerTabPanel';
import {
    PAYMENT_GATEWAY_TAB_COPY,
    feeColumns,
    receiptColumns,
    transactionColumns as gatewayTransactionColumns,
} from '../components/ledgers/paymentGatewayColumns';
import { SUBSCRIBER_TAB_COPY, subscriberTabColumns } from '../components/ledgers/subscriberColumns';
import { VENDOR_TAB_COPY, vendorTabColumns } from '../components/ledgers/vendorColumns';
import {
    SETUP_LABELS,
    EDITOR_LABELS,
    ORDER_SUMMARY_LABELS,
    eventColumns,
    historyColumns,
} from '../components/manualOperations/manualJournalColumns';
import {
    CHARGE_FORM_LABELS,
    DEFAULT_CHARGE_CARD_TITLE,
    THIRD_PARTY_CONFIGURATION_TAB_COPY,
    paymentLinkChargeColumns,
} from '../components/thirdPartyConfiguration/paymentLinkChargeColumns';
import { LEDGER_LEAF_BY_KIND, LEDGER_TAB_LABELS, LEDGER_TABS } from '../config/ledgerPaths';
import { MANUAL_OPERATION_CARDS } from '../config/manualOperations';
import { FAQ_ENTRIES, FAQ_SCREENS, FaqEntry, FaqScreen, faqEntryId } from '../faq/accountingFaq';
import { FAQ_CONCEPTS } from '../faq/faqConcepts';
import { feeDetailsColumns } from '../pages/FeeDetails';
import { summaryItems as otherSalesSummaryItems, otherSalesColumns } from '../pages/OtherSales';
import { summaryItems as partnerSummaryItems } from '../pages/PartnerLedgerDetail';
import { KPI_CARDS as PARTNER_KPI_CARDS, partnerListColumns } from '../pages/PartnerLedgerList';
import { summaryItems as gatewaySummaryItems } from '../pages/PaymentGatewayLedgerDetail';
import {
    KPI_CARDS as GATEWAY_KPI_CARDS,
    gatewayListColumns,
} from '../pages/PaymentGatewayLedgerList';
import { summaryItems as subscriberSummaryItems } from '../pages/SubscriberLedgerDetail';
import {
    KPI_CARDS as SUBSCRIBER_KPI_CARDS,
    subscriberListColumns,
} from '../pages/SubscriberLedgerList';
import { subscriptionDetailsColumns } from '../pages/SubscriptionDetails';
import {
    THIRD_PARTY_TAB_COPY,
    paymentLinkColumns,
    summaryItems as thirdPartySummaryItems,
} from '../pages/ThirdPartySales';
import {
    summaryItems as transactionsSummaryItems,
    transactionsColumns,
} from '../pages/Transactions';
import { summaryItems as vendorSummaryItems } from '../pages/VendorLedgerDetail';
import { KPI_CARDS as VENDOR_KPI_CARDS, vendorListColumns } from '../pages/VendorLedgerList';
import { EVIDENCE_LABELS } from '../utils/approvals';
import { CHART_CARD_TITLES } from '../utils/dashboardCharts';
import { ALERT_TITLES, INTERNAL_KPI_CARD_TITLES, KPI_CARD_TITLES } from '../utils/dashboardData';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: () => vi.fn() }));

const SKIPPED_COLUMN_KEYS = new Set(['actions', 'chevron']);

const noop = () => null;
const noopActions = { loadingKey: null, downloadDocument: async () => undefined };

type Surface = { screen: FaqScreen; tab: string; labels: string[] };

const columnLabels = (columns: { title?: unknown; key?: unknown }[]) =>
    columns
        .filter(column => !SKIPPED_COLUMN_KEYS.has(String(column.key)))
        .map(column => column.title)
        .filter((title): title is string => typeof title === 'string' && title.length > 0);

const itemLabels = (items: { label: string }[]) => items.map(item => item.label);

const zero = <T>() => ({}) as T;

const tabsOf = (kind: keyof typeof LEDGER_LEAF_BY_KIND) =>
    LEDGER_LEAF_BY_KIND[kind].tabs.filter(tab => tab !== LEDGER_TABS.statement);

const surfaces: Surface[] = [
    { screen: 'Dashboard', tab: 'KPIs', labels: KPI_CARD_TITLES },
    { screen: 'Dashboard', tab: 'Internal Purchases', labels: INTERNAL_KPI_CARD_TITLES },
    { screen: 'Dashboard', tab: 'Charts', labels: [...CHART_CARD_TITLES] },
    { screen: 'Dashboard', tab: 'Alerts', labels: [...ALERT_TITLES] },

    { screen: 'Vendors', tab: 'KPIs', labels: VENDOR_KPI_CARDS.map(card => card.title) },
    { screen: 'Vendors', tab: 'List', labels: columnLabels(vendorListColumns) },
    { screen: 'Vendors', tab: 'Summary', labels: itemLabels(vendorSummaryItems(zero())) },
    {
        screen: 'Vendors',
        tab: 'Tabs',
        labels: Object.values(VENDOR_TAB_COPY).map(copy => copy.title),
    },
    ...tabsOf('vendors').map(tab => ({
        screen: 'Vendors' as const,
        tab: LEDGER_TAB_LABELS[tab],
        labels: columnLabels(vendorTabColumns(tab, noop, noop, noop, noop, noop)),
    })),

    { screen: 'Subscribers', tab: 'KPIs', labels: SUBSCRIBER_KPI_CARDS.map(card => card.title) },
    { screen: 'Subscribers', tab: 'List', labels: columnLabels(subscriberListColumns) },
    { screen: 'Subscribers', tab: 'Summary', labels: itemLabels(subscriberSummaryItems(zero())) },
    {
        screen: 'Subscribers',
        tab: 'Tabs',
        labels: Object.values(SUBSCRIBER_TAB_COPY).map(copy => (copy as { title: string }).title),
    },
    ...tabsOf('subscribers').map(tab => ({
        screen: 'Subscribers' as const,
        tab: LEDGER_TAB_LABELS[tab],
        labels: columnLabels(subscriberTabColumns(tab)),
    })),

    { screen: 'Partners', tab: 'KPIs', labels: PARTNER_KPI_CARDS.map(card => card.title) },
    { screen: 'Partners', tab: 'List', labels: columnLabels(partnerListColumns) },
    { screen: 'Partners', tab: 'Summary', labels: itemLabels(partnerSummaryItems(zero())) },
    {
        screen: 'Partners',
        tab: 'Tabs',
        labels: Object.values(PARTNER_TAB_COPY).map(copy => copy.title),
    },
    { screen: 'Partners', tab: 'Payments Cards', labels: Object.values(PAYMENTS_CARD_LABELS) },
    ...tabsOf('partners').map(tab => ({
        screen: 'Partners' as const,
        tab: LEDGER_TAB_LABELS[tab],
        labels: columnLabels(partnerTabColumns(tab, noop)),
    })),

    { screen: 'Payment Gateways', tab: 'KPIs', labels: GATEWAY_KPI_CARDS.map(card => card.title) },
    { screen: 'Payment Gateways', tab: 'List', labels: columnLabels(gatewayListColumns) },
    { screen: 'Payment Gateways', tab: 'Summary', labels: itemLabels(gatewaySummaryItems(zero())) },
    {
        screen: 'Payment Gateways',
        tab: 'Tabs',
        labels: Object.values(PAYMENT_GATEWAY_TAB_COPY).map(copy => copy.title),
    },
    {
        screen: 'Payment Gateways',
        tab: 'Transactions',
        labels: columnLabels(gatewayTransactionColumns),
    },
    { screen: 'Payment Gateways', tab: 'Received', labels: columnLabels(receiptColumns(noop)) },
    { screen: 'Payment Gateways', tab: 'Bills', labels: columnLabels(feeColumns(noop)) },

    { screen: 'Other Sales', tab: 'Columns', labels: columnLabels(otherSalesColumns) },
    { screen: 'Other Sales', tab: 'Summary', labels: itemLabels(otherSalesSummaryItems(zero())) },

    {
        screen: 'Third-Party Sales',
        tab: 'Tabs',
        labels: Object.values(THIRD_PARTY_TAB_COPY).map(copy => copy.title),
    },
    { screen: 'Third-Party Sales', tab: 'Columns', labels: columnLabels(paymentLinkColumns) },
    {
        screen: 'Third-Party Sales',
        tab: 'Summary',
        labels: itemLabels(thirdPartySummaryItems(zero())),
    },

    {
        screen: 'Third Party Configuration',
        tab: 'Tabs',
        labels: Object.values(THIRD_PARTY_CONFIGURATION_TAB_COPY).map(copy => copy.title),
    },
    { screen: 'Third Party Configuration', tab: 'Cards', labels: [DEFAULT_CHARGE_CARD_TITLE] },
    {
        screen: 'Third Party Configuration',
        tab: 'Columns',
        labels: columnLabels(paymentLinkChargeColumns(noop)),
    },
    {
        screen: 'Third Party Configuration',
        tab: 'Form',
        labels: Object.values(CHARGE_FORM_LABELS),
    },

    { screen: 'Statements', tab: 'Columns', labels: columnLabels(statementColumns) },
    { screen: 'Statements', tab: 'Cards', labels: Object.values(STATEMENT_CARD_LABELS) },

    { screen: 'Transactions', tab: 'Columns', labels: columnLabels(transactionsColumns(noop)) },
    {
        screen: 'Transactions',
        tab: 'Summary',
        labels: itemLabels(transactionsSummaryItems(zero())),
    },
    {
        screen: 'Fee Details',
        tab: 'Columns',
        labels: [
            ...columnLabels(feeDetailsColumns('commission', noopActions)),
            ...columnLabels(feeDetailsColumns('platformFee', noopActions)),
        ],
    },
    {
        screen: 'Subscription Details',
        tab: 'Columns',
        labels: columnLabels(subscriptionDetailsColumns(noopActions)),
    },

    { screen: 'Approvals', tab: 'KPIs', labels: APPROVAL_KPI_CARDS.map(card => card.title) },
    { screen: 'Approvals', tab: 'Cards', labels: [APPROVAL_GATE_CARD_TITLE] },
    {
        screen: 'Approvals',
        tab: 'List',
        labels: columnLabels(approvalColumns({ canDecide: true })),
    },
    { screen: 'Approvals', tab: 'Evidence', labels: Object.values(EVIDENCE_LABELS) },

    { screen: 'Manual Operations', tab: 'Cards', labels: MANUAL_OPERATION_CARDS },
    { screen: 'Manual Operations', tab: 'Order', labels: Object.values(ORDER_SUMMARY_LABELS) },
    { screen: 'Manual Operations', tab: 'Events', labels: columnLabels(eventColumns(noop)) },
    { screen: 'Manual Operations', tab: 'Set-up', labels: Object.values(SETUP_LABELS) },
    { screen: 'Manual Operations', tab: 'Editor', labels: Object.values(EDITOR_LABELS) },
    { screen: 'Manual Operations', tab: 'History', labels: columnLabels(historyColumns) },
];

const onScreen = new Set(
    surfaces.flatMap(surface =>
        surface.labels.map(label => faqEntryId(surface.screen, surface.tab, label))
    )
);

const walkedTabs = new Set(surfaces.map(surface => `${surface.screen}::${surface.tab}`));

const byId = new Map(FAQ_ENTRIES.map(item => [item.id, item]));

describe('every figure on screen has an FAQ entry', () => {
    surfaces.forEach(surface => {
        it(`${surface.screen} › ${surface.tab}`, () => {
            const missing = surface.labels.filter(
                label => !byId.has(faqEntryId(surface.screen, surface.tab, label))
            );
            expect(missing, `add FAQ entries for ${surface.screen} › ${surface.tab}`).toEqual([]);
        });
    });

    it('walks at least one surface per screen', () => {
        const walked = new Set(surfaces.map(surface => surface.screen));
        FAQ_SCREENS.filter(screen => screen !== 'Order Journals').forEach(screen => {
            expect(walked.has(screen), `no surface walked for ${screen}`).toBe(true);
        });
    });
});

describe('every FAQ entry points at something that is still on screen', () => {
    it('has no entry for a label that was renamed or removed', () => {
        const stale = FAQ_ENTRIES.filter(
            (item: FaqEntry) =>
                walkedTabs.has(`${item.screen}::${item.tab}`) && !onScreen.has(item.id)
        ).map(item => item.id);
        expect(stale, 'remove or re-point these FAQ entries').toEqual([]);
    });

    it('keeps ids unique and concepts resolvable', () => {
        const ids = FAQ_ENTRIES.map(item => item.id);
        expect(new Set(ids).size).toBe(ids.length);

        const conceptIds = new Set(FAQ_CONCEPTS.map(concept => concept.id));
        FAQ_ENTRIES.forEach(item => {
            item.concepts.forEach(concept => {
                expect(
                    conceptIds.has(concept),
                    `${item.id} links to unknown concept ${concept}`
                ).toBe(true);
            });
        });
    });

    it('carries a real last-reviewed date on every entry and concept', () => {
        [...FAQ_ENTRIES, ...FAQ_CONCEPTS].forEach(item => {
            expect(item.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(Number.isNaN(Date.parse(item.lastReviewed))).toBe(false);
        });
    });

    it('keeps developer material out of what the page shows', () => {
        const shown = (item: FaqEntry) =>
            [item.label, item.question, item.answer, item.formula || '', item.whenMissing].join(
                ' '
            );
        const devLike =
            /\.js\b|\.tsx\b|journalData|journalRecordStatus|[a-z]+[A-Z][a-z]+[A-Z]|\bSUM\b|\bNULL\b|\bCOALESCE\b/;

        const leaks = FAQ_ENTRIES.filter(item => devLike.test(shown(item))).map(item => item.id);
        expect(leaks, 'rewrite these entries in the accounts team’s language').toEqual([]);

        const conceptLeaks = FAQ_CONCEPTS.filter(concept =>
            devLike.test([concept.title, concept.summary, ...concept.body].join(' '))
        ).map(concept => concept.id);
        expect(conceptLeaks, 'rewrite these concepts in the accounts team’s language').toEqual([]);
    });
});
