// import { ENV } from '@src/config-global';

import { accessKeys } from './accessKeys';

const CC_AVENUE_SERVICE_KEYS = new Set<string>([
    // Mobile Recharge
    // accessKeys.prepaid,
    accessKeys.postpaid,
    // Utility Payments
    accessKeys.electricity,
    accessKeys.lpg,
    accessKeys.broadband,
    accessKeys.dth,
    accessKeys.fastag,
    accessKeys.prepaidMeter,
    accessKeys.pipedGas,
    accessKeys.water,
    accessKeys.landline,
    accessKeys.creditCard,
]);

// // Gift cards use CCAvenue only in non-production environments for testing
// if (ENV !== 'production') {
//     CC_AVENUE_SERVICE_KEYS.add(accessKeys.giftCards);
//     CC_AVENUE_SERVICE_KEYS.add(accessKeys.xoxoday);
// }

export function isCCavenueService(accessKey?: string): boolean {
    if (!accessKey) return false;
    return CC_AVENUE_SERVICE_KEYS.has(accessKey);
}

export function isServiceGatewayEnabled(
    accessKey?: string,
    providers?: { pgProvider: string; code?: string }[],
    provider?: string | null
): boolean {
    if (!providers?.length) return true;
    if (isCCavenueService(accessKey)) {
        return providers.some(({ pgProvider }) => pgProvider === accessKeys.ccavenuePaymentGateway);
    }
    if (provider) {
        return provider !== 'CCAVENUE' && providers.some(({ code }) => code === provider);
    }
    return providers.some(({ pgProvider }) => pgProvider === accessKeys.cashfreePaymentGateway);
}
