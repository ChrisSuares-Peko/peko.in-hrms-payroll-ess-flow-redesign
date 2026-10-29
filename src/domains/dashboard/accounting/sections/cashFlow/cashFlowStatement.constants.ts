import { formatNumberWithLocalString } from '@utils/priceFormat';

import { CfTone } from '../../utils/cashFlowData';

export interface ToneClasses {
    header: string;
    net: string;
    amount: string;
}

export const toneClasses = (tone: CfTone): ToneClasses => {
    if (tone === 'danger') {
        return {
            header: 'bg-danger-surface text-danger',
            net: 'bg-danger-surface border border-danger-border',
            amount: 'text-danger',
        };
    }
    if (tone === 'warning') {
        return {
            header: 'bg-warning-surface text-warning',
            net: 'bg-warning-surface border border-warning-border',
            amount: 'text-warning',
        };
    }
    return {
        header: 'bg-success-surface text-success',
        net: 'bg-success-surface border border-success-border',
        amount: 'text-success',
    };
};

export const formatMoney = (n: number): string => {
    const formatted = `₹${formatNumberWithLocalString(Math.abs(n))}`;
    return n < 0 ? `(${formatted})` : formatted;
};
