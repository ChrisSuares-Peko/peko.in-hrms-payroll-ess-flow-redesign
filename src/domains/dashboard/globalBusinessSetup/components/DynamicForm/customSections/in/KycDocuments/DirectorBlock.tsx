import UploadBox from '../../ui/UploadBox';

const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png';
const IMG_ACCEPT = '.jpg,.jpeg,.png';

type Props = {
    index: number;
    name: string;
    nationality: string;
    indianNationalityValue: string;
    personLabel: string;
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
    error: (name: string) => string | undefined;
    // Repeater mode: instance fields are unnumbered ('director'); legacy mode
    // defaults to the numbered per-director block names ('director_0').
    fieldPrefix?: string;
};

export default function DirectorBlock({
    index,
    name,
    nationality,
    indianNationalityValue,
    personLabel,
    get,
    set,
    error,
    fieldPrefix,
}: Props) {
    const prefix = fieldPrefix ?? `director_${index}`;
    const isIndian =
        !!indianNationalityValue && nationality?.toLowerCase() === indianNationalityValue;

    return (
        <div className="space-y-4 rounded-xl border border-gray-200 p-4">
            <p className="font-medium text-gray-800">
                {personLabel} {index + 1}
                {name ? ` — ${name}` : ''}
            </p>

            {isIndian ? (
                <>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Photo <span className="text-red-500">*</span>
                        </p>
                        <UploadBox
                            accept={IMG_ACCEPT}
                            error={error(`${prefix}_photo`)}
                            value={get(`${prefix}_photo`)}
                            onChange={f => set(`${prefix}_photo`, f)}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                                Proof of Identity{' '}
                                <span className="text-xs text-gray-400">
                                    (Passport / Driving License / Election ID)
                                </span>{' '}
                                <span className="text-red-500">*</span>
                            </p>
                            <UploadBox
                                accept={DOC_ACCEPT}
                                error={error(`${prefix}_proof_identity`)}
                                value={get(`${prefix}_proof_identity`)}
                                onChange={f => set(`${prefix}_proof_identity`, f)}
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                                Proof of Address{' '}
                                <span className="text-xs text-gray-400">
                                    (Bank Statement / Utility Bill ≤2 months)
                                </span>{' '}
                                <span className="text-red-500">*</span>
                            </p>
                            <UploadBox
                                accept={DOC_ACCEPT}
                                error={error(`${prefix}_proof_address`)}
                                value={get(`${prefix}_proof_address`)}
                                onChange={f => set(`${prefix}_proof_address`, f)}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Photo <span className="text-red-500">*</span>
                        </p>
                        <UploadBox
                            accept={IMG_ACCEPT}
                            error={error(`${prefix}_photo`)}
                            value={get(`${prefix}_photo`)}
                            onChange={f => set(`${prefix}_photo`, f)}
                        />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            Passport{nationality && <span className="text-red-500"> *</span>}
                        </p>
                        <UploadBox
                            accept={DOC_ACCEPT}
                            error={error(`${prefix}_passport`)}
                            value={get(`${prefix}_passport`)}
                            onChange={f => set(`${prefix}_passport`, f)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
