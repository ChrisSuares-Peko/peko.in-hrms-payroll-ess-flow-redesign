import {
    FilterType,
    PaymentMethod,
    PaymentMethodLimitKey,
    PaymentMethodsState,
    PaymentMethodStatusFilter,
    PaymentMethodType,
} from '../types/paymentMethods';

export const PAYMENT_METHOD_LIMIT_FIELDS: {
    key: PaymentMethodLimitKey;
    label: string;
    shortLabel: string;
    maxLength: number;
}[] = [
    {
        key: 'limitPerTransaction',
        label: 'Limit per transaction',
        shortLabel: 'Per transaction',
        maxLength: 6,
    },
    { key: 'limitPerDay', label: 'Limit per day', shortLabel: 'Per day', maxLength: 8 },
    { key: 'limitPerMonth', label: 'Limit per month', shortLabel: 'Per month', maxLength: 10 },
];

export const PAYMENT_METHOD_OPTIONS = [
    { value: 'PAYMENT_GATEWAY', label: 'Payment gateway' },
    { value: 'WALLET', label: 'Wallet' },
    { value: 'CORPORATE_CARD', label: 'Corporate card' },
];

export const PAYMENT_METHOD_KIND_LABELS: Record<PaymentMethodType, string> = {
    PAYMENT_GATEWAY: 'Payment gateway',
    WALLET: 'Wallet payments',
    CORPORATE_CARD: 'Corporate card payments',
};

export const STATUS_FILTER_OPTIONS: { value: PaymentMethodStatusFilter; label: string }[] = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
];

export const WALLET_METHOD_FILTER = 'WALLET';
export const CORPORATE_CARD_METHOD_FILTER = 'CORPORATE_CARD';

export const toMethodFilters = (
    value?: string
): Pick<FilterType, 'paymentMethod' | 'pgProvider'> => {
    if (!value) return { paymentMethod: '', pgProvider: '' };
    if (value === WALLET_METHOD_FILTER) return { paymentMethod: 'WALLET', pgProvider: '' };
    if (value === CORPORATE_CARD_METHOD_FILTER) {
        return { paymentMethod: 'CORPORATE_CARD', pgProvider: '' };
    }
    return { paymentMethod: '', pgProvider: value };
};

export const getMethodFilterValue = (filters: Pick<FilterType, 'paymentMethod' | 'pgProvider'>) => {
    if (filters.paymentMethod === 'WALLET') return WALLET_METHOD_FILTER;
    if (filters.paymentMethod === 'CORPORATE_CARD') return CORPORATE_CARD_METHOD_FILTER;
    return filters.pgProvider || '';
};

export const GLOBAL_SETTING_KEYS: (keyof PaymentMethodsState)[] = [
    'isGatewayPaymentAvailable',
    'isWalletPaymentAvailable',
    'isCorporateCardPaymentAvailable',
    'isCouponApplicable',
];

export const toLimitAmount = (value?: number | string | null) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const getPartnerLabel = (record: Pick<PaymentMethod, 'name' | 'partnerId'>) => {
    if (record.name) return record.name;
    return record.partnerId === null ? 'Default' : 'Unknown partner';
};

export const getPaymentMethodName = (
    record: Pick<PaymentMethod, 'paymentMethod' | 'pgProviderName'>
) => {
    if (record.paymentMethod === 'WALLET') return 'Wallet';
    if (record.paymentMethod === 'CORPORATE_CARD') return 'Corporate card';
    return record.pgProviderName || 'Payment gateway';
};

export const isSameGlobalSettings = (first: PaymentMethodsState, second: PaymentMethodsState) =>
    GLOBAL_SETTING_KEYS.every(key => first[key] === second[key]);

export const applyGlobalSettingToggle = (
    settings: PaymentMethodsState,
    key: keyof PaymentMethodsState,
    checked: boolean
): PaymentMethodsState => {
    if (key === 'isCouponApplicable' && checked && !settings.isGatewayPaymentAvailable) {
        return settings;
    }
    if (key === 'isGatewayPaymentAvailable' && !checked) {
        return { ...settings, isGatewayPaymentAvailable: false, isCouponApplicable: false };
    }
    return { ...settings, [key]: checked };
};
