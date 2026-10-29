import { ReactNode } from 'react';

import {
    AccountBookOutlined,
    BankOutlined,
    BookOutlined,
    FileExclamationOutlined,
    FileTextOutlined,
    ImportOutlined,
    MailOutlined,
    PercentageOutlined,
    ScissorOutlined,
    SendOutlined,
    ShoppingOutlined,
    WalletOutlined,
} from '@ant-design/icons';

import { paths } from '@src/routes/paths';

import { LEDGER_TABS, LedgerKind, LedgerTabKey } from './ledgerPaths';
import { accountingLeafPath } from './servicePaths';
import { CommissionInvoiceSource } from '../types/commissionInvoice';
import { ManualJournalKey } from '../types/manualJournal';

export const MANUAL_OPERATION_GROUPS = [
    'Orders',
    'Vendors',
    'Partners',
    'Payment Gateways',
    'Subscribers',
] as const;

export type ManualOperationGroup = (typeof MANUAL_OPERATION_GROUPS)[number];

export type ManualOperationLedger = {
    kind: LedgerKind;
    tab: LedgerTabKey;
    pickIntro: string;
};

export type ManualOperation = {
    key: string;
    title: string;
    description: string;
    icon: ReactNode;
    path: string;
    group: ManualOperationGroup;
    ledger?: ManualOperationLedger;
};

export const MANUAL_OPERATIONS_INTRO =
    'Entries recorded by hand. Pick an operation, then the order or the profile it is for: it opens the page where the entry is recorded, corrected or deleted, and every correction is kept in the audit trail.';

export const manualOperationsPath = () =>
    accountingLeafPath(paths.accountingAdmin.manualOperations);

export const manualOperationPath = (key: string) => `${manualOperationsPath()}/${key}`;

export const manualJournalPath = (
    corporateTxnId?: string | null,
    event?: ManualJournalKey | null
) => {
    const root = `${manualOperationsPath()}/journal`;
    if (!corporateTxnId) return root;
    const query = event ? `?event=${event}` : '';
    return `${root}/${encodeURIComponent(corporateTxnId)}${query}`;
};

export const commissionInvoicePath = (
    target?: { vendorId: number | string; source: CommissionInvoiceSource; id: string } | null
) => {
    const root = `${manualOperationsPath()}/commission-invoice`;
    if (!target) return root;
    const query = new URLSearchParams({
        vendor: String(target.vendorId),
        source: target.source,
        id: target.id,
    });
    return `${root}?${query.toString()}`;
};

const ledgerOperation = (
    key: string,
    title: string,
    description: string,
    icon: ReactNode,
    group: ManualOperationGroup,
    ledger: ManualOperationLedger
): ManualOperation => ({
    key,
    title,
    description,
    icon,
    group,
    ledger,
    path: manualOperationPath(key),
});

export const MANUAL_OPERATIONS: ManualOperation[] = [
    {
        key: 'journal',
        title: 'Journal',
        description: 'Record an accounting entry the pipeline never posted for an order.',
        icon: <BookOutlined />,
        path: manualJournalPath(),
        group: 'Orders',
    },
    {
        key: 'commission-invoice',
        title: 'Commission Invoice',
        description:
            'Check a commission invoice, change who it is billed to and send it to the vendor.',
        icon: <MailOutlined />,
        path: commissionInvoicePath(),
        group: 'Orders',
    },
    ledgerOperation(
        'vendor-deposits',
        'Vendor Deposits',
        'Record, correct or delete a deposit paid to a vendor.',
        <BankOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.deposits,
            pickIntro: 'Pick the vendor whose deposits you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'vendor-credit-notes',
        'Vendor Credit Notes',
        'Record, correct or delete a credit note raised by hand against a vendor.',
        <FileTextOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.creditNotes,
            pickIntro: 'Pick the vendor whose credit notes you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'vendor-commissions',
        'Vendor Commissions',
        'Record, correct or delete a commission recorded by hand for a vendor.',
        <PercentageOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.commissions,
            pickIntro:
                'Pick the vendor whose manual commissions you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'vendor-cost-of-sales',
        'Vendor Cost of Sales',
        'Record, correct or delete a cost of sales entry recorded by hand for a vendor.',
        <ShoppingOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.costOfSales,
            pickIntro:
                'Pick the vendor whose cost of sales entries you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'vendor-debit-notes',
        'Vendor Debit Notes',
        'Record, correct or delete a debit note raised on a vendor, the mirror of a cost of sales.',
        <FileExclamationOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.debitNotes,
            pickIntro: 'Pick the vendor whose debit notes you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'vendor-opening-balances',
        'Vendor Opening Balances',
        'Set, correct or delete the balance carried in for a vendor.',
        <AccountBookOutlined />,
        'Vendors',
        {
            kind: 'vendors',
            tab: LEDGER_TABS.deposits,
            pickIntro:
                'Pick the vendor whose opening balance you want to set, correct or delete. It is listed with the deposits.',
        }
    ),
    ledgerOperation(
        'partner-payouts',
        'Partner Payouts',
        'Record, correct or delete a payout made to a partner.',
        <SendOutlined />,
        'Partners',
        {
            kind: 'partners',
            tab: LEDGER_TABS.payments,
            pickIntro: 'Pick the partner whose payouts you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'partner-debit-notes',
        'Partner Debit Notes',
        'Record, correct or delete a debit note raised against a partner.',
        <FileExclamationOutlined />,
        'Partners',
        {
            kind: 'partners',
            tab: LEDGER_TABS.debitNotes,
            pickIntro: 'Pick the partner whose debit notes you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'partner-opening-balances',
        'Partner Opening Balances',
        'Set, correct or delete what was still owed to a partner when the portal started.',
        <AccountBookOutlined />,
        'Partners',
        {
            kind: 'partners',
            tab: LEDGER_TABS.payments,
            pickIntro:
                'Pick the partner whose opening balance you want to set, correct or delete. It is listed with the payments.',
        }
    ),
    ledgerOperation(
        'gateway-receipts',
        'Gateway Receipts',
        'Record, correct or delete money a payment gateway settled to Peko.',
        <ImportOutlined />,
        'Payment Gateways',
        {
            kind: 'payment_gateways',
            tab: LEDGER_TABS.receivedAndBills,
            pickIntro: 'Pick the gateway whose receipts you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'gateway-fees',
        'Gateway Fees',
        'Record, correct or delete a fee a payment gateway kept.',
        <ScissorOutlined />,
        'Payment Gateways',
        {
            kind: 'payment_gateways',
            tab: LEDGER_TABS.receivedAndBills,
            pickIntro: 'Pick the gateway whose fees you want to record, correct or delete.',
        }
    ),
    ledgerOperation(
        'gateway-opening-balances',
        'Gateway Opening Balances',
        'Set, correct or delete what a payment gateway still held when the portal started.',
        <AccountBookOutlined />,
        'Payment Gateways',
        {
            kind: 'payment_gateways',
            tab: LEDGER_TABS.receivedAndBills,
            pickIntro:
                'Pick the gateway whose opening balance you want to set, correct or delete. It is listed with the receipts.',
        }
    ),
    ledgerOperation(
        'subscriber-wallet-adjustments',
        'Subscriber Wallet Adjustments',
        'Open a subscriber’s wallet to top it up or withdraw from it through Transfer Funds.',
        <WalletOutlined />,
        'Subscribers',
        {
            kind: 'subscribers',
            tab: LEDGER_TABS.wallet,
            pickIntro:
                'Pick the subscriber whose wallet you want to adjust. Adjust wallet on its Cashbacks & Rewards tab opens Transfer Funds.',
        }
    ),
];

export const MANUAL_OPERATION_CARDS = MANUAL_OPERATIONS.map(operation => operation.title);

export const findManualOperation = (key: string | undefined) =>
    MANUAL_OPERATIONS.find(operation => operation.key === key);
