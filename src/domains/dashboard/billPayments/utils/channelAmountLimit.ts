import { BillerPaymentChannelInfo } from '@customtypes/general';
import { ENV } from '@src/config-global';
import { accessKeys } from '@utils/accessKeys';
import { roundMoney } from '@utils/priceFormat';

export type ChannelAmountBound = { minAmount?: number; maxAmount?: number };

export type BillerWithChannels = {
    billerPaymentChannels?: {
        paymentChannelInfo?: BillerPaymentChannelInfo | BillerPaymentChannelInfo[];
    };
};

const SERVICE_MIN_AMOUNT: Record<string, number> = { [accessKeys.fastag]: 100 };

const applyServiceFloor = (bound: ChannelAmountBound, accessKeyName: string): ChannelAmountBound => {
    const floor = SERVICE_MIN_AMOUNT[accessKeyName];
    if (!floor) return bound;
    const minAmount = Math.max(bound.minAmount ?? 0, floor);
    if (bound.maxAmount !== undefined && minAmount > bound.maxAmount) return bound;
    return { minAmount, maxAmount: bound.maxAmount };
};

function resolveChannelEntryBound(
    accessKeyName: string,
    selectedBiller?: BillerWithChannels
): ChannelAmountBound {
    const info = selectedBiller?.billerPaymentChannels?.paymentChannelInfo;
    const entries = Array.isArray(info) ? info : [info];
    const channel = accessKeyName === accessKeys.test ? 'AGT' : 'INT';
    const entry = entries.find(
        e => String(e?.paymentChannelName || '').toLowerCase() === channel.toLowerCase()
    );
    const minPaise = Number(String(entry?.minAmount ?? '').trim());
    const maxPaise = Number(String(entry?.maxAmount ?? '').trim());
    const min = Number.isFinite(minPaise) && minPaise > 0 ? roundMoney(minPaise / 100) : undefined;
    const max = Number.isFinite(maxPaise) && maxPaise > 0 ? roundMoney(maxPaise / 100) : undefined;
    if (min !== undefined && max !== undefined && min > max) return {};
    return { minAmount: min, maxAmount: max };
}

export function resolveChannelAmountBound(
    accessKeyName: string,
    selectedBiller?: BillerWithChannels
): ChannelAmountBound {
    if (ENV !== 'production') return {};
    return applyServiceFloor(resolveChannelEntryBound(accessKeyName, selectedBiller), accessKeyName);
}

export function tightenWithChannelBound(
    minimumAmount: number | undefined,
    maximumAmount: number | undefined,
    bound?: ChannelAmountBound
) {
    if (!bound || (bound.minAmount === undefined && bound.maxAmount === undefined)) {
        return { minimumAmount, maximumAmount };
    }
    const nextMin =
        bound.minAmount !== undefined
            ? Math.max(minimumAmount ?? 0, bound.minAmount)
            : minimumAmount;
    const nextMax =
        bound.maxAmount !== undefined
            ? Math.min(maximumAmount ?? Number.POSITIVE_INFINITY, bound.maxAmount)
            : maximumAmount;
    if (nextMin !== undefined && nextMax !== undefined && nextMin > nextMax) {
        return { minimumAmount, maximumAmount };
    }
    return { minimumAmount: nextMin, maximumAmount: nextMax };
}
