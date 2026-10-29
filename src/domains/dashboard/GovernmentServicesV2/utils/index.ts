import { paths } from '@src/routes/paths';

import { ServiceDetail } from '../types';
import { serviceDetailsMap } from './serviceDetailsMap';

export { serviceDetailsMap };

// Trademark Registration, Trademark Objection, and Import Export Code all funnel through the
// same generic governmentServicesApplication data and share three entry points into "which form
// segment comes next" (useServiceDetailData's post-payment redirect, useGovtServicePayment's
// successPath, MyApplications.tsx's goToService) — kept here, not duplicated three times, so a
// new service added to this set only needs one change.
export const resolveGovtServiceFormSegment = (serviceName?: string | null, variantName?: string | null): string => {
    const name = (serviceName ?? '').toLowerCase();
    const variant = (variantName ?? '').toLowerCase();
    if (name.includes('objection')) return paths.governmentServices.objection;
    if (name.includes('expedited') || variant.includes('expedited')) return paths.governmentServices.expedited;
    if (name.includes('import export code')) return paths.governmentServices.iec;
    return paths.governmentServices.register;
};

// Not exported — only getServiceDetailByAccessKey (built from these below) is used outside this file.
const serviceEndpointMap: Record<number, string> = {
    1: 'gst-registration',
    2: 'pt-registration',
    // 3: 'shop-establishment', // Not in Phase 1
    4: 'tan-registration',
    5: 'epf-registration',
    6: 'esi-registration',
    7: 'pan-registration',
    // 8: 'gst-composition', // Not in Phase 1
    9: 'msme-registration',
    10: 'trademark-registration',
    11: 'startup-india',
    // 12: 'iso-certification', // Not in Phase 1
    13: 'fssai-basic',
    14: 'fssai-state',
    15: 'fssai-central',
    27: 'iec-registration',
    // 28: 'dsc', // Not in Phase 1 — replaced by the 29 (Company) / 30 (Individual) split below
    // --- Phase 1 additions ---
    29: 'dsc-company',
    30: 'dsc-individual',
    31: 'virtual-office',
    32: 'trademark-objection',
    33: 'trademark-protection',
    34: 'expedited-trademark',
    35: 'gstr-1',
    36: 'gstr-3b',
    37: 'gst-revocation',
    38: 'gst-cancellation',
};

// Maps known API slugs that differ from serviceEndpointMap values
const slugOverrides: Record<string, number> = {
    'msme-udyam-registration': 9,
    // 'pollution-control-board-consent': 23, // Not in Phase 1
    // 'digital-signature-certificate': 28, // Not in Phase 1 — see 29/30 split
    // 'digital-signature-certificate-dsc': 28, // Not in Phase 1
    // 'digital-signature': 28, // Not in Phase 1
    'import-export-code': 27,
    'iec': 27,
    // 'rera-registration': 25, // Not in Phase 1
    // 'rera-registration-promoter': 25, // Not in Phase 1
    // 'rera-registration-agent': 26, // Not in Phase 1
    // 'retail-drug-license': 16, // Not in Phase 1
    // 'wholesale-drug-license': 17, // Not in Phase 1
    // 'drug-license': 16, // Not in Phase 1
    // 'drug-store-license': 16, // Not in Phase 1
    // 'pharmacy-license': 16, // Not in Phase 1
    'startup-india-recognition': 11,
    'startup-india-dpiit': 11,
};

const toAccessKey = (slug: string) => `govt_${slug.replace(/-/g, '_')}`;

const serviceAccessKeyMap: Record<number, string> = Object.fromEntries(
    Object.entries(serviceEndpointMap).map(([id, slug]) => [Number(id), toAccessKey(slug)])
);

const localIdByAccessKey: Record<string, number> = Object.fromEntries(
    Object.entries(serviceAccessKeyMap).map(([id, key]) => [key, Number(id)])
);

const slugToAccessKeyFallback: Record<string, string> = {
    ...Object.fromEntries(
        Object.entries(serviceEndpointMap).map(([, slug]) => [slug, toAccessKey(slug)])
    ),
    ...Object.fromEntries(
        Object.entries(slugOverrides).map(([apiSlug, localId]) => [apiSlug, toAccessKey(serviceEndpointMap[localId] ?? '')])
    ),
};

export const getServiceDetailByAccessKey = (accessKey: string): ServiceDetail | undefined => {
    const localId = localIdByAccessKey[accessKey] ?? localIdByAccessKey[slugToAccessKeyFallback[accessKey] ?? ''];
    return localId !== undefined ? serviceDetailsMap[localId] : undefined;
};
