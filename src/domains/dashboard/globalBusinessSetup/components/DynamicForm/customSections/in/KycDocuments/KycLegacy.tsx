import { Alert, Progress } from 'antd';

import DirectorBlock from './DirectorBlock';
import { useKycDocuments } from './useKycDocuments';
import { CustomSectionRenderProps } from '../../types';
import UploadBox from '../../ui/UploadBox';

const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png';

/**
 * Legacy self-managed mode (no builder repeater): numbered per-director blocks
 * rendered inline, driven by the mapped section via ctrl gate fields. This is
 * the original KYC Documents layout — preserved exactly for sections saved
 * before repeater support.
 */
export default function KycLegacy({ section, config, instancePath }: CustomSectionRenderProps) {
    const ctrl = useKycDocuments(section, instancePath, config);
    const requiredFields: string[] = [];

    if (ctrl.hasOffice) {
        requiredFields.push('noc_from_owner');
        if (ctrl.isOwned) requiredFields.push('title_utility_doc');
        else requiredFields.push('utility_bill', 'rent_lease_deed');
    }
    for (let i = 0; i < ctrl.directorCount; i += 1) {
        requiredFields.push(`director_${i}_photo`);
        const nat = (ctrl.nationalities[i] ?? '').toLowerCase();

        if (nat === ctrl.indianNationalityValue && ctrl.indianNationalityValue !== '') {
            requiredFields.push(`director_${i}_proof_identity`, `director_${i}_proof_address`);
        } else {
            requiredFields.push(`director_${i}_passport`);
        }
    }
    requiredFields.push('name_availability_cert');
    requiredFields.push('trademark_certificate');

    const uploaded = requiredFields.filter(name => {
        const v = ctrl.get(name);

        return v !== undefined && v !== null && v !== '';
    }).length;
    const progress =
        requiredFields.length > 0 ? Math.round((uploaded / requiredFields.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">
                    Upload Progress —{' '}
                    <span className="font-semibold text-primary">
                        {uploaded} of {requiredFields.length} documents uploaded
                    </span>
                </p>
                <Progress percent={progress} showInfo={false} size="small" />
            </div>

            {ctrl.hasOffice && (
                <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-800">Registered Office Documents</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                                NOC from Owner <span className="text-red-500">*</span>
                            </p>
                            <UploadBox
                                accept={DOC_ACCEPT}
                                error={ctrl.error('noc_from_owner')}
                                value={ctrl.get('noc_from_owner')}
                                onChange={f => ctrl.set('noc_from_owner', f)}
                            />
                        </div>
                        {ctrl.isOwned ? (
                            <div className="space-y-1">
                                <p className="text-sm text-gray-600">
                                    Title Document or Utility Bill{' '}
                                    <span className="text-red-500">*</span>
                                </p>
                                <UploadBox
                                    accept={DOC_ACCEPT}
                                    error={ctrl.error('title_utility_doc')}
                                    value={ctrl.get('title_utility_doc')}
                                    onChange={f => ctrl.set('title_utility_doc', f)}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">
                                        Utility Bill <span className="text-red-500">*</span>
                                    </p>
                                    <UploadBox
                                        accept={DOC_ACCEPT}
                                        error={ctrl.error('utility_bill')}
                                        value={ctrl.get('utility_bill')}
                                        onChange={f => ctrl.set('utility_bill', f)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-600">
                                        Rent / Lease Deed <span className="text-red-500">*</span>
                                    </p>
                                    <UploadBox
                                        accept={DOC_ACCEPT}
                                        error={ctrl.error('rent_lease_deed')}
                                        value={ctrl.get('rent_lease_deed')}
                                        onChange={f => ctrl.set('rent_lease_deed', f)}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">
                    {ctrl.isLLP ? 'Designated Partner KYC Documents' : 'Director KYC Documents'}
                </h4>
                {ctrl.directorCount === 0 ? (
                    <Alert
                        type="warning"
                        showIcon
                        message={`No ${ctrl.isLLP ? 'partners' : 'directors'} found. Please complete the previous step first.`}
                    />
                ) : (
                    Array.from({ length: ctrl.directorCount }, (_, i) => (
                        <DirectorBlock
                            key={i}
                            error={ctrl.error}
                            get={ctrl.get}
                            index={i}
                            indianNationalityValue={ctrl.indianNationalityValue}
                            name={ctrl.directorNames[i] ?? ''}
                            nationality={ctrl.nationalities[i] ?? ''}
                            personLabel={ctrl.personLabel}
                            set={ctrl.set}
                        />
                    ))
                )}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800">
                    Name Approval / Trademark{' '}
                    <span className="text-sm font-normal text-gray-400">(if applicable)</span>
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Name Availability Certificate <span className="text-red-500">*</span>
                        </p>
                        <UploadBox
                            accept={DOC_ACCEPT}
                            error={ctrl.error('name_availability_cert')}
                            value={ctrl.get('name_availability_cert')}
                            onChange={f => ctrl.set('name_availability_cert', f)}
                        />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Trademark Certificate{' '}
                            <span className="text-xs text-gray-400">(if name based on TM)</span>
                        </p>
                        <UploadBox
                            accept={DOC_ACCEPT}
                            error={ctrl.error('trademark_certificate')}
                            value={ctrl.get('trademark_certificate')}
                            onChange={f => ctrl.set('trademark_certificate', f)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
