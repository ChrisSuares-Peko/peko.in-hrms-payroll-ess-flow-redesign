import { accessKeys } from '@utils/accessKeys';

import { planServicesMap } from './index';
import type { PackageService } from '../types';

export type FeatureItem = {
    name: string;
    description?: string;
};

export function buildDisplayFeatures(
    services: PackageService[],
    options?: { whatsAppDescription?: string | null }
): FeatureItem[] {
    const whatsAppDescription = options?.whatsAppDescription || undefined;

    type Acc = { groupSeen: Set<string>; items: { order: number; item: FeatureItem }[] };

    const { items } = services.reduce<Acc>(
        ({ groupSeen, items: acc }, service) => {
            const def = planServicesMap[service.accessKey];

            if (!def) return { groupSeen, items: acc };

            if (def.group) {
                if (groupSeen.has(def.group)) return { groupSeen, items: acc };
                groupSeen.add(def.group);
            }

            // Grouped services (e.g. invoicing = invoices + alankit_einvoice) must read pricing
            // from the same representative row the plans comparison table picks: the first group
            // member in planServicesMap order that the package carries — not whichever member
            // happens to appear first in the package's services array (it may be the unpriced one).
            const source = def.group
                ? Object.entries(planServicesMap)
                      .filter(([, d]) => d.group === def.group)
                      .map(([key]) => services.find(s => s.accessKey === key))
                      .find(Boolean) ?? service
                : service;

            // Mirror the plans comparison table cell logic exactly: a service shows its
            // format() description only when it carries meaningful pricing/surcharge data,
            // otherwise it's just the name with a tick. We never synthesise a generic
            // "+x% service fee" line — services like Mobile Recharge & Bills and Utility
            // Payments (no format) stay tick-only, matching the plans page.
            const bothZero =
                source.unitPrice === 0 &&
                source.baseLimit === 0 &&
                !(def.usesSurcharge && source.surcharge);

            // WhatsApp for Business pricing lives in the separate whatsappPlans source,
            // not the package's own service prices, so its shared description wins here
            // exactly as it overrides the format() text on the plans page.
            const formatted =
                def.format && !bothZero
                    ? def.format(
                          source.unitPrice ?? 0,
                          source.baseLimit ?? 0,
                          source.surcharge ?? 0,
                          source.surchargeType
                      ) || undefined
                    : undefined;
            const description =
                service.accessKey === accessKeys.whatsappBasic && whatsAppDescription
                    ? whatsAppDescription
                    : formatted;

            return {
                groupSeen,
                items: acc.concat({
                    order: def.order ?? 999,
                    item: { name: def.label, description },
                }),
            };
        },
        { groupSeen: new Set<string>(), items: [] }
    );

    // The plans page lists WhatsApp for Business across all plans (its pricing is sourced
    // from whatsappPlans, independent of the package's services). Keep parity: if the
    // package didn't carry the WhatsApp service but we have its pricing text, add it.
    const whatsAppDef = planServicesMap[accessKeys.whatsappBasic];
    const hasWhatsApp = services.some(s => s.accessKey === accessKeys.whatsappBasic);
    const finalItems =
        whatsAppDescription && whatsAppDef && !hasWhatsApp
            ? items.concat({
                  order: whatsAppDef.order ?? 999,
                  item: { name: whatsAppDef.label, description: whatsAppDescription },
              })
            : items;

    return finalItems.sort((a, b) => a.order - b.order).map(i => i.item);
}

export function parseServiceListToFeatures(serviceList: string): FeatureItem[] {
    if (!serviceList) return [];

    const lines = serviceList
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    if (!lines.length) return [];

    const hasSectionHeaders = lines.some(l => l.startsWith('##'));

    if (!hasSectionHeaders) {
        return lines.map(name => ({ name }));
    }

    type Acc = { features: FeatureItem[]; current: string | null; descLines: string[] };

    const flush = (features: FeatureItem[], current: string | null, descLines: string[]): FeatureItem[] =>
        current
            ? features.concat({ name: current, description: descLines.length > 0 ? descLines.join(' · ') : undefined })
            : features;

    const { features, current, descLines } = lines.reduce<Acc>(
        ({ features: acc, current: cur, descLines: desc }, line) =>
            line.startsWith('##')
                ? { features: flush(acc, cur, desc), current: line.replace(/^##\s*/, ''), descLines: [] }
                : { features: acc, current: cur, descLines: desc.concat(line) },
        { features: [], current: null, descLines: [] }
    );

    return flush(features, current, descLines);
}
