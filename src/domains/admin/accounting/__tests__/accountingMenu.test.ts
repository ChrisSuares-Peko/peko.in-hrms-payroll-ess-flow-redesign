import { ReactElement } from 'react';

import { describe, expect, it } from 'vitest';

import { getPathFromLabel } from '@src/domains/admin/utils/helperFunctions';

import AccountingPlaceholder from '../components/AccountingPlaceholder';
import {
    ACCOUNTING_MENU,
    ACCOUNTING_SERVICE_CATEGORY,
    LEDGER_PAGES,
    accountingLeafPath,
    accountingServicePath,
} from '../config/accountingMenu';
import { LEDGER_KINDS, LEDGER_LEAF_BY_KIND, accountingLedgerPath } from '../config/ledgerPaths';

const CATALOGUE_FIXTURE: Record<string, string[]> = {
    Operations: [
        'Order Journals',
        'Wallet Journals',
        'Service without plans',
        'Service with plans',
        'Peko Subscriptions',
        'Whitelabel Partners',
        'Chart of Accounts',
        'Internal Purchase Accounts',
    ],
    Ledgers: ['Vendors', 'Subscribers', 'Partners', 'Payment Gateways'],
    Others: ['Approvals', 'Manual Operations', 'Audit Trail', 'FAQ'],
};

const titleCaseSlug = (slug: string) =>
    slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

const allLeaves = ACCOUNTING_MENU.flatMap(group => group.leaves);

describe('ACCOUNTING_MENU registry', () => {
    it('mirrors the backend catalogue groups and leaf names', () => {
        const actual = Object.fromEntries(
            ACCOUNTING_MENU.map(group => [group.category, group.leaves.map(leaf => leaf.label)])
        );
        expect(actual).toEqual(CATALOGUE_FIXTURE);
        expect(ACCOUNTING_SERVICE_CATEGORY).toBe('Accounting');
    });

    it('derives every slug from its label the same way the admin helpers do', () => {
        allLeaves.forEach(leaf => {
            expect(leaf.slug).toBe(getPathFromLabel(leaf.label));
        });
    });

    it('uses labels that survive the RoleGuard slug round trip', () => {
        allLeaves.forEach(leaf => {
            expect(leaf.label).toMatch(/^[A-Za-z0-9 ]+$/);
            expect(titleCaseSlug(leaf.slug).toLowerCase()).toBe(leaf.label.toLowerCase());
        });
    });

    it('has unique labels and slugs', () => {
        const labels = allLeaves.map(leaf => leaf.label);
        const slugs = allLeaves.map(leaf => leaf.slug);
        expect(new Set(labels).size).toBe(labels.length);
        expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('gives Approvals a real page rather than the placeholder', () => {
        const approvals = allLeaves.find(leaf => leaf.label === 'Approvals');
        expect((approvals?.element as ReactElement).type).not.toBe(AccountingPlaceholder);
    });

    it('gives the Audit Trail a real page rather than the placeholder', () => {
        const auditTrail = allLeaves.find(leaf => leaf.label === 'Audit Trail');
        expect((auditTrail?.element as ReactElement).type).not.toBe(AccountingPlaceholder);
        expect(auditTrail?.slug).toBe('audit-trail');
    });

    it('builds leaf paths under the accounting root', () => {
        expect(accountingLeafPath('order-journals')).toBe('/system-user/accounting/order-journals');
    });

    it('nests detail routes under the service and ledger leaves only', () => {
        const withChildren = allLeaves.filter(leaf => leaf.children?.length);
        expect(
            withChildren.map(leaf => [leaf.label, leaf.children?.map(child => child.path)])
        ).toEqual([
            ['Service without plans', [':accessKey/:tab?']],
            ['Service with plans', [':accessKey/:tab?']],
            ['Vendors', [':id/:tab?']],
            ['Subscribers', [':id/:tab?']],
            ['Partners', [':id/:tab?']],
            ['Payment Gateways', [':id/:tab?']],
            [
                'Manual Operations',
                ['journal', 'journal/:corporateTxnId', 'commission-invoice', ':operation'],
            ],
        ]);
    });

    it('builds ledger detail paths with the default tab', () => {
        expect(accountingLedgerPath('vendors', 'VEN-1041')).toBe(
            '/system-user/accounting/vendors/VEN-1041/transactions'
        );
        expect(
            accountingLedgerPath('payment_gateways', 'PG-RAZORPAY', 'statement-of-accounts')
        ).toBe('/system-user/accounting/payment-gateways/PG-RAZORPAY/statement-of-accounts');
    });

    it('gives every ledger the agreed tabs and keeps its record actions on them', () => {
        expect(
            Object.fromEntries(LEDGER_KINDS.map(kind => [kind, LEDGER_LEAF_BY_KIND[kind].tabs]))
        ).toEqual({
            vendors: [
                'transactions',
                'commissions',
                'credit-notes',
                'cost-of-sales',
                'debit-notes',
                'deposits',
                'statement-of-accounts',
            ],
            subscribers: ['transactions', 'wallet', 'bills'],
            partners: [
                'transactions',
                'own-subscriptions',
                'payments',
                'debit-notes',
                'statement-of-accounts',
            ],
            payment_gateways: ['transactions', 'received-and-bills', 'statement-of-accounts'],
        });
        expect(
            LEDGER_KINDS.map(kind => Object.keys(LEDGER_LEAF_BY_KIND[kind].recordActions || {}))
        ).toEqual([
            ['deposits', 'credit-notes', 'commissions', 'cost-of-sales', 'debit-notes'],
            [],
            ['payments', 'debit-notes'],
            ['received-and-bills'],
        ]);
        LEDGER_KINDS.forEach(kind => {
            const { tabs, recordActions } = LEDGER_LEAF_BY_KIND[kind];
            Object.values(recordActions || {}).forEach(action => {
                expect(tabs).toContain(action.tab);
            });
        });
    });

    it('registers a real page pair for every ledger, with no generated-data path left', () => {
        expect(Object.keys(LEDGER_PAGES)).toEqual([...LEDGER_KINDS]);
        LEDGER_KINDS.forEach(kind => {
            expect(LEDGER_PAGES[kind].List).toBeTruthy();
            expect(LEDGER_PAGES[kind].Detail).toBeTruthy();
        });
    });

    it('builds service detail paths with the default tab per kind', () => {
        expect(accountingServicePath('with_plans', 'esim')).toBe(
            '/system-user/accounting/service-with-plans/esim/plans'
        );
        expect(accountingServicePath('without_plans', 'tbo_airline', 'vendor')).toBe(
            '/system-user/accounting/service-without-plans/tbo_airline/vendor'
        );
    });
});
