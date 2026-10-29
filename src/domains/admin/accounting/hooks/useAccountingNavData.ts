import { useMemo } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    ACCOUNTING_MENU,
    ACCOUNTING_SERVICE_CATEGORY,
    AccountingMenuLeaf,
} from '../config/accountingMenu';

export type AccountingNavGroup = {
    category: string;
    items: AccountingMenuLeaf[];
};

export default function useAccountingNavData(): AccountingNavGroup[] {
    const services = useAppSelector(state => state.reducer.services.services?.data);

    return useMemo(() => {
        const accounting = services?.find(
            item =>
                item.serviceCategory?.toLowerCase() === ACCOUNTING_SERVICE_CATEGORY.toLowerCase() &&
                item.hasAccess
        );
        if (!accounting) return [];

        return ACCOUNTING_MENU.map(group => {
            const grantedGroup = accounting.services?.find(
                category => category.category === group.category && category.hasAccess
            );
            const items = grantedGroup
                ? group.leaves.filter(item =>
                      grantedGroup.services?.some(
                          sub => sub.service === item.label && sub.hasAccess
                      )
                  )
                : [];
            return { category: group.category, items };
        }).filter(group => group.items.length > 0);
    }, [services]);
}
