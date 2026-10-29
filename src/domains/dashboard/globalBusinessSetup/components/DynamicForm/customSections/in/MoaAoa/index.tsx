import { Alert, Checkbox } from 'antd';

import AoaSection from './AoaSection';
import { buildAoaHtml } from './aoaTemplate';
import BusinessActivityCard from './BusinessActivityCard';
import MoaSection from './MoaSection';
import { buildMoaHtml } from './moaTemplate';
import { buildTemplateData } from './resolve';
import { useMoaAoa } from './useMoaAoa';
import WhatsNext from './WhatsNext';
import { useCountries } from '../../../../../hooks/useCountries';
import { openDocument } from '../../htmlDoc';
import { CustomSectionRenderProps } from '../../types';
import GeneratedDoc from '../../ui/GeneratedDoc';
import { useFormValues } from '../../useFormValues';

/**
 * Sample custom section: an MCA (Companies Act 2013) MOA & AOA builder step.
 * Reads the live form data and opens the generated documents in a new tab.
 */
export default function MoaAoa({ config, section, instancePath }: CustomSectionRenderProps) {
    const controller = useMoaAoa(section, instancePath);
    const values = useFormValues();

    // Countries (same source the form's country selects use) so subscriber
    // nationality ids resolve to country names in the generated documents.
    const { countriesAndDetails } = useCountries('', '', 'is_active=true');

    // Everything the MOA/AOA templates need, derived from the entered form values
    // and the section's field mappings (shared with the submit-time generator).
    const { templateData, companyName, activity, sourced } = buildTemplateData(
        values,
        config,
        countriesAndDetails
    );

    // The document body is rebuilt from the live form values on every render, so the
    // preview and the on-click PDF download always reflect the latest data. The saved
    // copy is (re)generated at submit time by finalizeCustomSections.
    const moaHtml = buildMoaHtml({
        data: templateData,
        clause: controller.mainObjectClause,
        ancillaryItems: controller.ancillaryItems.filter(o => controller.ancillary.includes(o.key)),
    });
    const aoaHtml = buildAoaHtml(templateData);

    const previewMoa = () => openDocument('Memorandum of Association', moaHtml);
    const previewAoa = () => openDocument('Articles of Association', aoaHtml);

    // The business activity (NIC category) must be chosen in an earlier step
    // before this page can build the MOA & AOA documents.
    if (!sourced) {
        return (
            <Alert
                type="warning"
                showIcon
                message="Select your business activity first"
                description="Pick your company's business activity (category) in the earlier step to generate the MOA & AOA documents."
            />
        );
    }

    return (
        <div className="w-full">
            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">MOA &amp; AOA</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Define the foundational documents for your company - MOA outlines
                        objectives, AOA defines internal rules
                    </p>
                </div>

                <div className="space-y-6">
                    <BusinessActivityCard activity={activity} />
                    <MoaSection controller={controller} onPreview={previewMoa} />
                    <AoaSection controller={controller} onPreview={previewAoa} />

                    <div
                        className={`rounded-xl border p-3 ${
                            controller.confirmedError
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                        }`}
                    >
                        <Checkbox
                            checked={controller.confirmed}
                            onChange={e => controller.setConfirmed(e.target.checked)}
                        >
                            <span className="text-sm">
                                I confirm that the selected MOA and AOA templates are appropriate
                                for my business
                            </span>
                        </Checkbox>
                        {controller.confirmedError && (
                            <p className="mt-1 text-xs text-red-500">{controller.confirmedError}</p>
                        )}
                    </div>

                    {controller.confirmed &&
                        (controller.moaType === 'standard' ||
                            controller.aoaType === 'standard') && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700">
                                    Generated documents
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {controller.moaType === 'standard' && (
                                        <GeneratedDoc
                                            fileName={`MOA - ${companyName}.pdf`}
                                            html={moaHtml}
                                            label="MOA (PDF)"
                                        />
                                    )}
                                    {controller.aoaType === 'standard' && (
                                        <GeneratedDoc
                                            fileName={`AOA - ${companyName}.pdf`}
                                            html={aoaHtml}
                                            label="AOA (PDF)"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                    <WhatsNext />
                </div>
            </div>
        </div>
    );
}
