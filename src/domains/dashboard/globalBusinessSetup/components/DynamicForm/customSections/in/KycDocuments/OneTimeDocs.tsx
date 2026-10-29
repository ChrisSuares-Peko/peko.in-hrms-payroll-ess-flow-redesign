import { useKycRepeater } from './useKycRepeater';
import { CustomSectionRenderProps } from '../../types';
import UploadBox from '../../ui/UploadBox';

const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png';

const filled = (v: unknown) => v !== undefined && v !== null && v !== '';

/**
 * One-time documents (registered office, name approval) for repeated KYC
 * sections — stored on instance 0, rendered once below the director blocks in
 * the inline view. This is the `sync` owner: through the hook's sync effect it
 * seeds/prunes the instances, mirrors the mapped nationalities/names into every
 * instance, and maintains the `kyc_docs_valid` sentinel that blocks navigation
 * until these are uploaded.
 */
export default function OneTimeDocs({ section, config, instancePath }: CustomSectionRenderProps) {
    const ctrl = useKycRepeater(section, instancePath, config, { sync: true });
    const sentinelError = ctrl.error('kyc_docs_valid');

    const docs = [
        { name: 'noc_from_owner', label: 'NOC from Owner', show: ctrl.hasOffice, required: true },
        {
            name: 'title_utility_doc',
            label: 'Title Document or Utility Bill',
            show: ctrl.hasOffice && ctrl.isOwned,
            required: true,
        },
        {
            name: 'utility_bill',
            label: 'Utility Bill',
            show: ctrl.hasOffice && !ctrl.isOwned,
            required: true,
        },
        {
            name: 'rent_lease_deed',
            label: 'Rent / Lease Deed',
            show: ctrl.hasOffice && !ctrl.isOwned,
            required: true,
        },
        {
            name: 'name_availability_cert',
            label: 'Name Availability Certificate',
            show: true,
            required: true,
        },
        {
            name: 'trademark_certificate',
            label: 'Trademark Certificate (if name based on TM)',
            show: true,
            required: false,
        },
    ].filter(doc => doc.show);

    return (
        <div className="mt-4 space-y-4 rounded-xl border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-800">
                Registered Office / Name Approval Documents
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {docs.map(doc => (
                    <div key={doc.name} className="space-y-1">
                        <p className="text-sm text-gray-600">
                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </p>
                        <UploadBox
                            accept={DOC_ACCEPT}
                            value={ctrl.get(doc.name)}
                            onChange={f => ctrl.set(doc.name, f)}
                            error={
                                sentinelError && doc.required && !filled(ctrl.get(doc.name))
                                    ? `${doc.label} is required`
                                    : undefined
                            }
                        />
                    </div>
                ))}
            </div>
            {sentinelError && (
                <p className="text-xs text-red-500">
                    Please upload the registered office and name approval documents highlighted
                    above.
                </p>
            )}
        </div>
    );
}
