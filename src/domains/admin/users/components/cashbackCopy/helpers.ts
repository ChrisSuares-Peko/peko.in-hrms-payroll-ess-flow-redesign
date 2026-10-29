import { CopyPackage } from '../../types/cashbackCopy';

export const PEKO_LABEL = 'Peko (Default)';

export type MappingRow = {
    fromId: number;
    toId: number | null;
    isAuto: boolean;
};

export const autoMap = (fromPkgs: CopyPackage[], toPkgs: CopyPackage[]): MappingRow[] => {
    const toIndividualByAccess = new Map<string, CopyPackage[]>();
    toPkgs
        .filter(p => p.packageType === 'INDIVIDUAL' && p.accessCode)
        .forEach(p => {
            const list = toIndividualByAccess.get(p.accessCode!) ?? [];
            list.push(p);
            toIndividualByAccess.set(p.accessCode!, list);
        });

    const toGroups = toPkgs.filter(p => p.packageType !== 'INDIVIDUAL');
    const used = new Set<number>();

    return fromPkgs.map(src => {
        let toId: number | null = null;
        let isAuto = false;

        if (src.packageType === 'INDIVIDUAL') {
            if (src.accessCode) {
                const candidates = (toIndividualByAccess.get(src.accessCode) ?? []).filter(
                    p => !used.has(p.id)
                );
                let match: CopyPackage | undefined;
                if (candidates.length === 1) {
                    match = candidates[0];
                } else if (candidates.length > 1) {
                    const srcName = src.packageName?.toLowerCase() ?? '';
                    if (srcName) {
                        const exact = candidates.filter(
                            p => (p.packageName?.toLowerCase() ?? '') === srcName
                        );
                        if (exact.length === 1) {
                            match = exact[0];
                        } else {
                            const partial = candidates.filter(t => {
                                const tn = t.packageName?.toLowerCase() ?? '';
                                return tn && (srcName.includes(tn) || tn.includes(srcName));
                            });
                            if (partial.length === 1) match = partial[0];
                        }
                    }
                }
                if (match) {
                    toId = match.id;
                    isAuto = true;
                    used.add(match.id);
                }
            }
        } else {
            const srcName = src.packageName?.toLowerCase() ?? '';
            if (srcName) {
                const candidates = toGroups.filter(t => {
                    if (used.has(t.id)) return false;
                    const tn = t.packageName?.toLowerCase() ?? '';
                    return srcName.includes(tn) || tn.includes(srcName);
                });
                if (candidates.length === 1) {
                    toId = candidates[0].id;
                    isAuto = true;
                    used.add(candidates[0].id);
                }
            }
        }

        return { fromId: src.id, toId, isAuto };
    });
};

export const toNum = (v: number | string | null | undefined): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};
