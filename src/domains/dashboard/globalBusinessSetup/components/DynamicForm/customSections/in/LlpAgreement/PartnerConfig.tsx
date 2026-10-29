import { Typography } from 'antd';

import { Partner } from './resolve';
import { LlpAgreementController } from './useLlpAgreement';

type PartnerConfigProps = {
    controller: LlpAgreementController;
    partners: Partner[];
};

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
        </div>
    );
}

export default function PartnerConfig({ controller, partners }: PartnerConfigProps) {
    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-gray-800">Partner Configuration</h3>
                <p className="text-sm text-gray-500">
                    Configure capital contribution and profit sharing for each partner
                </p>
            </div>

            <div className="space-y-4">
                <div className="rounded-xl bg-red-50/40 p-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Capital Contribution</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {controller.totalCapital
                                ? `₹ ${Number(controller.totalCapital).toLocaleString('en-IN')}`
                                : '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Minimum recommended: ₹1,00,000 (One Lakh)
                        </p>
                    </div>
                </div>

                <p className="text-xs text-gray-400">Prefilled from earlier steps</p>

                {partners.length === 0 && (
                    <Typography.Text type="secondary" className="text-sm">
                        No partners found — map the partner fields in the section settings.
                    </Typography.Text>
                )}

                {partners.map((partner, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 p-4">
                        <p className="text-xs font-semibold text-gray-500">
                            PARTNER {idx + 1}
                            {partner.designation ? ` · ${partner.designation}` : ''}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Detail label="Partner Name" value={partner.name} />
                            <Detail
                                label="Capital Contribution"
                                value={partner.contribution ? `₹${partner.contribution}` : ''}
                            />
                            <Detail label="Profit Share" value={partner.profitShare} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
