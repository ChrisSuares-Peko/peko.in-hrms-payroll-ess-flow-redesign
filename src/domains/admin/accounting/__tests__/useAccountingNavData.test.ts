import { renderHook } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import useAccountingNavData from '../hooks/useAccountingNavData';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

type Leaf = { service: string; hasAccess: boolean };
type Group = { category: string; hasAccess: boolean; services: Leaf[] };

const category = (hasAccess: boolean, groups: Group[]) => ({
    reducer: {
        services: {
            services: {
                data: [
                    { serviceCategory: 'Dashboard', hasAccess: true, services: [] },
                    { serviceCategory: 'Accounting', hasAccess, services: groups },
                ],
            },
        },
    },
});

const group = (name: string, hasAccess: boolean, leaves: [string, boolean][]): Group => ({
    category: name,
    hasAccess,
    services: leaves.map(([service, access]) => ({ service, hasAccess: access })),
});

const setState = (state: unknown) => {
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(state));
};

describe('useAccountingNavData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns every registry group when the role grants everything', () => {
        setState(
            category(true, [
                group('Operations', true, [
                    ['Order Journals', true],
                    ['Service without plans', true],
                    ['Service with plans', true],
                    ['Peko Subscriptions', true],
                    ['Whitelabel Partners', true],
                    ['Chart of Accounts', true],
                ]),
                group('Ledgers', true, [
                    ['Vendors', true],
                    ['Subscribers', true],
                    ['Partners', true],
                    ['Payment Gateways', true],
                ]),
                group('Others', true, [['Approvals', true]]),
            ])
        );

        const { result } = renderHook(() => useAccountingNavData());

        expect(result.current.map(g => g.category)).toEqual(['Operations', 'Ledgers', 'Others']);
        expect(result.current[0].items.map(i => i.label)).toEqual([
            'Order Journals',
            'Service without plans',
            'Service with plans',
            'Peko Subscriptions',
            'Whitelabel Partners',
            'Chart of Accounts',
        ]);
    });

    it('keeps only granted leaves and drops empty groups', () => {
        setState(
            category(true, [
                group('Operations', true, [
                    ['Order Journals', true],
                    ['Chart of Accounts', false],
                ]),
                group('Ledgers', true, [['Vendors', false]]),
                group('Others', true, [['Approvals', true]]),
            ])
        );

        const { result } = renderHook(() => useAccountingNavData());

        expect(result.current).toHaveLength(2);
        expect(result.current[0].category).toBe('Operations');
        expect(result.current[0].items.map(i => i.label)).toEqual(['Order Journals']);
        expect(result.current[1].category).toBe('Others');
    });

    it('returns nothing when the Accounting category itself is off', () => {
        setState(category(false, [group('Operations', true, [['Order Journals', true]])]));

        const { result } = renderHook(() => useAccountingNavData());

        expect(result.current).toEqual([]);
    });

    it('hides a group whose own access is off even if a leaf is on', () => {
        setState(category(true, [group('Operations', false, [['Order Journals', true]])]));

        const { result } = renderHook(() => useAccountingNavData());

        expect(result.current).toEqual([]);
    });

    it('returns nothing before the services have loaded', () => {
        setState({ reducer: { services: { services: null } } });

        const { result } = renderHook(() => useAccountingNavData());

        expect(result.current).toEqual([]);
    });
});
