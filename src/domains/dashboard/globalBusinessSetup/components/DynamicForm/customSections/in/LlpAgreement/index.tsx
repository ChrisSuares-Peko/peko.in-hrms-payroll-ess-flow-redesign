import { Alert, Button, Checkbox } from 'antd';

import Checklist from './Checklist';
import { PARTNER_DUTIES, PARTNER_RIGHTS } from './constants';
import DisputeCard from './DisputeCard';
import { buildLlpHtml } from './llpTemplate';
import ManagementCard from './ManagementCard';
import PartnerConfig from './PartnerConfig';
import { buildLlpData } from './resolve';
import TemplateCard from './TemplateCard';
import { useLlpAgreement } from './useLlpAgreement';
import { openDocument } from '../../htmlDoc';
import { CustomSectionRenderProps } from '../../types';
import GeneratedDoc from '../../ui/GeneratedDoc';
import { useFormValues } from '../../useFormValues';

/**
 * Custom section: an MCA (LLP Act, 2008) Limited Liability Partnership Agreement
 * builder. Reads the live form data and generates the agreement on demand.
 */
export default function LlpAgreement({ config, section, instancePath }: CustomSectionRenderProps) {
    const controller = useLlpAgreement(section, instancePath);
    const values = useFormValues();

    const { companyName, activity, sourced, partners } = buildLlpData(values, config);

    const rights = PARTNER_RIGHTS.filter(r => controller.rights.includes(r.key)).map(r => r.label);
    const duties = PARTNER_DUTIES.filter(d => controller.duties.includes(d.key)).map(d => d.label);

    // Rebuilt from live values each render, so preview + download always match.
    const llpHtml = buildLlpHtml({
        companyName,
        nicCode: activity.code,
        partners,
        totalCapital: controller.totalCapital,
        rights,
        duties,
        meetingQuorum: controller.meetingQuorum,
        votingThreshold: controller.votingThreshold,
        disputeMethod: controller.disputeMethod,
        jurisdiction: controller.jurisdiction,
    });

    const previewLlp = () => openDocument('LLP Agreement', llpHtml);

    if (!sourced) {
        return (
            <Alert
                type="warning"
                showIcon
                message="Select your business activity first"
                description="Pick your company's business activity (category) in the earlier step to generate the LLP Agreement."
            />
        );
    }

    return (
        <div className="w-full">
            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">LLP Agreement</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Define the partnership agreement for your Limited Liability Partnership -
                        outlines partner rights, duties, profit sharing, and management structure
                    </p>
                </div>

                <div className="space-y-6">
                    <TemplateCard controller={controller} />

                    {controller.llpType === 'standard' && (
                        <>
                            <PartnerConfig controller={controller} partners={partners} />

                            <div>
                                <p className="text-sm font-semibold text-gray-700">
                                    Business Activities
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Prefilled from earlier step
                                </p>
                                <p className="mt-1 text-sm text-gray-800">{activity.code || '—'}</p>
                            </div>

                            <Checklist
                                description="Select the standard rights that partners will have in the LLP"
                                options={PARTNER_RIGHTS}
                                selected={controller.rights}
                                title="Rights of Partners"
                                onToggle={controller.toggleRight}
                            />
                            <Checklist
                                description="Select the standard duties that partners must fulfill"
                                options={PARTNER_DUTIES}
                                selected={controller.duties}
                                title="Duties of Partners"
                                onToggle={controller.toggleDuty}
                            />
                            <ManagementCard controller={controller} />
                            <DisputeCard controller={controller} />

                            <div className="flex flex-wrap gap-3">
                                <Button onClick={previewLlp}>Preview Your LLP Agreement</Button>
                                <GeneratedDoc
                                    fileName={`LLP Agreement - ${companyName}.pdf`}
                                    html={llpHtml}
                                    label="Draft Agreement"
                                />
                            </div>
                        </>
                    )}

                    <div
                        className={`rounded-xl p-3 ${controller.confirmedError ? 'bg-red-50/50' : 'bg-red-50/40'}`}
                    >
                        <Checkbox
                            checked={controller.confirmed}
                            onChange={e => controller.setConfirmed(e.target.checked)}
                        >
                            <span className="text-sm">
                                I understand that this is a draft LLP Agreement. The final agreement
                                will be reviewed and finalized by legal professionals before
                                submission to the Ministry of Corporate Affairs (MCA).
                            </span>
                        </Checkbox>
                        {controller.confirmedError && (
                            <p className="mt-1 text-xs text-red-500">{controller.confirmedError}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
