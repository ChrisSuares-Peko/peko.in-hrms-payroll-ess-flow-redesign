import { paths } from '@src/routes/paths';

import { accountingLeafPath } from './servicePaths';

export const LEDGER_KINDS = ['vendors', 'subscribers', 'partners', 'payment_gateways'] as const;

export type LedgerKind = (typeof LEDGER_KINDS)[number];

export const LEDGER_TABS = {
    transactions: 'transactions',
    commissions: 'commissions',
    costOfSales: 'cost-of-sales',
    deposits: 'deposits',
    creditNotes: 'credit-notes',
    wallet: 'wallet',
    bills: 'bills',
    ownSubscriptions: 'own-subscriptions',
    payments: 'payments',
    debitNotes: 'debit-notes',
    receivedAndBills: 'received-and-bills',
    statement: 'statement-of-accounts',
} as const;

export type LedgerTabKey = (typeof LEDGER_TABS)[keyof typeof LEDGER_TABS];

export const LEDGER_TAB_LABELS: Record<LedgerTabKey, string> = {
    transactions: 'Transactions',
    commissions: 'Commissions',
    'cost-of-sales': 'Cost of Sales',
    deposits: 'Deposits',
    'credit-notes': 'Credit Notes',
    wallet: 'Cashbacks & Rewards',
    bills: 'Bills',
    'own-subscriptions': 'Own Subscriptions',
    payments: 'Payments',
    'debit-notes': 'Debit Notes',
    'received-and-bills': 'Received & Bills',
    'statement-of-accounts': 'Statement of Accounts',
};

export const LEDGER_DEFAULT_TAB: LedgerTabKey = LEDGER_TABS.transactions;

export type LedgerListProps = {
    openTab?: LedgerTabKey;
    intro?: string;
};

export type LedgerRecordAction = {
    tab: LedgerTabKey;
    label: string;
    entryLabel: string;
};

export type LedgerLeaf = {
    label: string;
    slug: string;
    noun: string;
    backLabel: string;
    intro: string;
    tabs: LedgerTabKey[];
    recordActions?: Partial<Record<LedgerTabKey, LedgerRecordAction>>;
};

export const LEDGER_LEAF_BY_KIND: Record<LedgerKind, LedgerLeaf> = {
    vendors: {
        label: 'Vendors',
        slug: paths.accountingAdmin.vendors,
        noun: 'Vendor',
        backLabel: 'All vendors',
        intro: 'Prepaid deposits held per vendor. Open a vendor to see its transactions, commissions, credit notes, cost of sales, debit notes and deposits.',
        tabs: [
            LEDGER_TABS.transactions,
            LEDGER_TABS.commissions,
            LEDGER_TABS.creditNotes,
            LEDGER_TABS.costOfSales,
            LEDGER_TABS.debitNotes,
            LEDGER_TABS.deposits,
            LEDGER_TABS.statement,
        ],
        recordActions: {
            [LEDGER_TABS.deposits]: {
                tab: LEDGER_TABS.deposits,
                label: 'Record deposit',
                entryLabel: 'Deposit',
            },
            [LEDGER_TABS.creditNotes]: {
                tab: LEDGER_TABS.creditNotes,
                label: 'Record credit note',
                entryLabel: 'Credit note',
            },
            [LEDGER_TABS.commissions]: {
                tab: LEDGER_TABS.commissions,
                label: 'Record commission',
                entryLabel: 'Commission',
            },
            [LEDGER_TABS.costOfSales]: {
                tab: LEDGER_TABS.costOfSales,
                label: 'Record cost of sales',
                entryLabel: 'Cost of sales',
            },
            [LEDGER_TABS.debitNotes]: {
                tab: LEDGER_TABS.debitNotes,
                label: 'Record debit note',
                entryLabel: 'Debit note',
            },
        },
    },
    subscribers: {
        label: 'Subscribers',
        slug: paths.accountingAdmin.subscribers,
        noun: 'Subscriber',
        backLabel: 'All subscribers',
        intro: 'Wallet balances held for each subscriber. Open a subscriber to see its orders including Peko plan payments, its cashbacks and rewards with every other wallet movement, and the invoices it was issued.',
        tabs: [LEDGER_TABS.transactions, LEDGER_TABS.wallet, LEDGER_TABS.bills],
    },
    partners: {
        label: 'Partners',
        slug: paths.accountingAdmin.partners,
        noun: 'Partner',
        backLabel: 'All partners',
        intro: 'What Peko owes each whitelabel partner. Open a partner to see what its portal earned, what has been paid out, what debit notes took back and what is still outstanding.',
        tabs: [
            LEDGER_TABS.transactions,
            LEDGER_TABS.ownSubscriptions,
            LEDGER_TABS.payments,
            LEDGER_TABS.debitNotes,
            LEDGER_TABS.statement,
        ],
        recordActions: {
            [LEDGER_TABS.payments]: {
                tab: LEDGER_TABS.payments,
                label: 'Record payout',
                entryLabel: 'Payout',
            },
            [LEDGER_TABS.debitNotes]: {
                tab: LEDGER_TABS.debitNotes,
                label: 'Record debit note',
                entryLabel: 'Debit note',
            },
        },
    },
    payment_gateways: {
        label: 'Payment Gateways',
        slug: paths.accountingAdmin.paymentGateways,
        noun: 'Payment gateway',
        backLabel: 'All gateways',
        intro: 'Reconciliation per gateway: what customers paid through it, what it has handed over and what it kept as its charges.',
        tabs: [LEDGER_TABS.transactions, LEDGER_TABS.receivedAndBills, LEDGER_TABS.statement],
        recordActions: {
            [LEDGER_TABS.receivedAndBills]: {
                tab: LEDGER_TABS.receivedAndBills,
                label: 'Record receipt',
                entryLabel: 'Receipt',
            },
        },
    },
};

export const accountingLedgerPath = (
    kind: LedgerKind,
    id: string,
    tab: LedgerTabKey = LEDGER_DEFAULT_TAB
) => `${accountingLeafPath(LEDGER_LEAF_BY_KIND[kind].slug)}/${encodeURIComponent(id)}/${tab}`;
