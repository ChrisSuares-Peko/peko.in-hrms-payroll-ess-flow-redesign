import { FC, useEffect, useState } from 'react';

import { Button, Checkbox } from 'antd';

import RuleSection, { ChangeMeta, CountPill } from './RuleSection';
import { changeText } from './ruleUtils';
import { OndcDomainRule, RuleLastChange } from '../../../../types/ondcCatalogRules';

interface Props {
    domains: OndcDomainRule[];
    /** products refused because their domain is off (summary, last 24 h) */
    hiding: number;
    lastChange: RuleLastChange | null;
    saving: boolean;
    onSave: (changes: { code: string; enabled: boolean }[]) => void;
    onHistory: () => void;
}

const domainMeta = (d: OndcDomainRule) => {
    if (!d.lastSeenAt && !d.storedCount) return 'nothing received yet';
    if (d.enabled) return `${d.storedCount} products`;
    return `${d.hiddenCount} products hidden`;
};

const shortCode = (code: string) => code.replace(/^ONDC:/, '');

const DomainsCard: FC<Props> = ({ domains, hiding, lastChange, saving, onSave, onHistory }) => {
    const [draft, setDraft] = useState<Record<string, boolean>>({});
    useEffect(() => setDraft({}), [domains]);

    const isOn = (d: OndcDomainRule) => draft[d.code] ?? d.enabled;
    const changes = domains
        .filter(d => isOn(d) !== d.enabled)
        .map(d => ({ code: d.code, enabled: isOn(d) }));
    const allowedCount = domains.filter(isOn).length;

    const toggle = (d: OndcDomainRule) => setDraft(prev => ({ ...prev, [d.code]: !isOn(d) }));

    return (
        <RuleSection
            title="Domains we ingest"
            count={`${allowedCount} of ${domains.length} allowed`}
            description="Every ONDC domain we have received a catalog from. Products from a domain that is switched off are kept but hidden from corporates. A domain we see for the first time starts switched off."
            extra={<CountPill>Hiding {hiding} products</CountPill>}
        >
            {domains.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#EAECF0] py-6 text-center text-[12px] text-[#98A2B3]">
                    No catalogs received yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {domains.map(d => {
                        const on = isOn(d);
                        const empty = !d.lastSeenAt && !d.storedCount;
                        return (
                            // the whole tile toggles; the checkbox stops propagation so a direct click doesn't flip twice
                            <div
                                key={d.code}
                                role="presentation"
                                onClick={() => toggle(d)}
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                                    on
                                        ? 'border-[#D0D5DD] bg-white'
                                        : 'border-[#EAECF0] bg-[#FCFCFD] hover:border-[#D0D5DD]'
                                }`}
                            >
                                <Checkbox
                                    checked={on}
                                    onClick={e => e.stopPropagation()}
                                    onChange={() => toggle(d)}
                                    className="mt-0.5"
                                />
                                <span className="flex min-w-0 flex-col">
                                    <span
                                        className={`text-[13px] font-medium ${
                                            empty && !on ? 'text-[#667085]' : 'text-[#101828]'
                                        }`}
                                    >
                                        {d.name}
                                    </span>
                                    <span
                                        className={`text-[11px] ${empty ? 'text-[#98A2B3]' : 'text-[#667085]'}`}
                                    >
                                        {shortCode(d.code)} · {domainMeta(d)}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <ChangeMeta text={changeText(lastChange)} onHistory={onHistory} />
                <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#667085]">
                        Switch domains on or off, then save. New catalogs follow the change.
                    </span>
                    <Button
                        size="small"
                        type="primary"
                        disabled={!changes.length}
                        loading={saving}
                        onClick={() => onSave(changes)}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </RuleSection>
    );
};

export default DomainsCard;
