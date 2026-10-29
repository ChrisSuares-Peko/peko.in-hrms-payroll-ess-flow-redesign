import { Alert, Progress } from 'antd';

import DirectorInstanceBlock from './DirectorInstanceBlock';
import OneTimeDocs from './OneTimeDocs';
import { useKycRepeater } from './useKycRepeater';
import { CustomSectionRenderProps } from '../../types';

const filled = (v: unknown) => v !== undefined && v !== null && v !== '';

// Fields the repeater single-instance spec must carry. If a section was saved
// before the repeater rework, these are absent and the layout can't bind — show
// a re-save prompt instead.
const REQUIRED_SPECS = ['kyc_docs_valid', 'ctrl_indian', 'ctrl_foreign', 'director_photo'];

/**
 * Repeater mode with inline display: the component mounts once at the section
 * path and lays out one DirectorBlock per instance (count mirrored from the
 * admin-selected field_value source), followed by the one-time documents.
 */
export default function KycRepeaterView(props: CustomSectionRenderProps) {
    const { section } = props;
    const missing = REQUIRED_SPECS.some(name => !section.fields?.some(f => f.name === name));

    if (missing) {
        return (
            <Alert
                type="warning"
                showIcon
                message="This section's fields are out of date. Please re-save this section in the form builder."
            />
        );
    }

    return <RepeaterBody {...props} />;
}

function RepeaterBody({ section, config, form, instancePath }: CustomSectionRenderProps) {
    const ctrl = useKycRepeater(section, instancePath, config);

    const docs: boolean[] = [];

    ctrl.instanceValues.forEach((inst, i) => {
        const nat = (ctrl.nationalities[i] ?? '').toLowerCase();
        const isIndian = nat !== '' && nat === ctrl.indianNationalityValue;

        docs.push(filled(inst.director_photo));
        if (isIndian) {
            docs.push(filled(inst.director_proof_identity));
            docs.push(filled(inst.director_proof_address));
        } else {
            docs.push(filled(inst.director_passport));
        }
    });

    const first = ctrl.instanceValues[0] || {};

    if (ctrl.hasOffice) {
        docs.push(filled(first.noc_from_owner));
        if (ctrl.isOwned) {
            docs.push(filled(first.title_utility_doc));
        } else {
            docs.push(filled(first.utility_bill));
            docs.push(filled(first.rent_lease_deed));
        }
    }
    docs.push(filled(first.name_availability_cert));
    docs.push(filled(first.trademark_certificate));

    const uploaded = docs.filter(Boolean).length;
    const progress = docs.length > 0 ? Math.round((uploaded / docs.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">
                    Upload Progress —{' '}
                    <span className="font-semibold text-primary">
                        {uploaded} of {docs.length} documents uploaded
                    </span>
                </p>
                <Progress percent={progress} showInfo={false} size="small" />
            </div>

            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">
                    {ctrl.isLLP ? 'Designated Partner KYC Documents' : 'Director KYC Documents'}
                </h4>
                {ctrl.requiredCount === 0 ? (
                    <Alert
                        type="warning"
                        showIcon
                        message={`No ${ctrl.isLLP ? 'partners' : 'directors'} found. Please complete the previous step first.`}
                    />
                ) : (
                    ctrl.instanceValues.map((_, i) => (
                        <DirectorInstanceBlock
                            key={i}
                            index={i}
                            indianNationalityValue={ctrl.indianNationalityValue}
                            instancePath={`${instancePath}.${i}`}
                            name={ctrl.directorNames[i] ?? ''}
                            nationality={ctrl.nationalities[i] ?? ''}
                            personLabel={ctrl.personLabel}
                            section={section}
                        />
                    ))
                )}
            </div>

            <OneTimeDocs
                config={config}
                form={form}
                instancePath={instancePath}
                section={section}
            />
        </div>
    );
}
