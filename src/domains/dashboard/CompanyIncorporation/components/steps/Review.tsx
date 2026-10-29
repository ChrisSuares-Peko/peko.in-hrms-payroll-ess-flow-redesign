import { EditOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import { useFormikContext } from 'formik';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ApplicationPayload, DirectorInfo, EntityType, NomineeInfo } from '../../types';

interface ReviewProps {
    onEditStep: (step: number) => void;
}

interface InfoFieldProps {
    label: string;
    value?: string | number | boolean | null;
    valueColor?: string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const InfoField = ({ label, value, valueColor }: InfoFieldProps) => {
    let display: string;
    if (value === true) display = 'Yes';
    else if (value === false) display = 'No';
    else if (value != null && value !== '') {
        const str = String(value);
        // Preserve case for emails (and any other identifier containing @)
        // so user-entered values render exactly as typed.
        display = str.includes('@') ? str : capitalize(str);
    } else display = '—';

    return (
        <div className="flex flex-col gap-1">
            <p className="text-[13px] text-slate-500 font-normal">{label}</p>
            <p className="text-[15px] font-semibold leading-snug break-words" style={{ color: valueColor || '#27272e' }}>
                {display}
            </p>
        </div>
    );
};

const ReviewGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-2 gap-x-12 gap-y-5">{children}</div>
);

interface SectionCardProps {
    title: string;
    step: number;
    onEditStep: (step: number) => void;
    children: React.ReactNode;
}

const SectionCard = ({ title, step, onEditStep, children }: SectionCardProps) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold text-neutral-950">{title}</h3>
            <Button
                icon={<EditOutlined />}
                onClick={() => onEditStep(step)}
                className="!bg-white !border !border-errorTextRed !text-errorTextRed hover:!bg-bgRedLight !rounded-[8px] !h-auto !px-4 !py-[5px] !font-normal !text-[14px] transition-colors"
            >
                Edit
            </Button>
        </div>
        <div className="border border-slate-200 rounded-[16px] p-6 space-y-6">{children}</div>
    </div>
);

const ENTITY_TYPE_LABELS: Record<string, string> = {
    [EntityType.PRIVATE_LIMITED]: 'Private Limited',
    [EntityType.PUBLIC_LIMITED]: 'Public Limited',
    [EntityType.OPC]: 'OPC',
    [EntityType.LLP]: 'LLP',
};

const PARTNER_RIGHTS_LABELS: Record<string, string> = {
    accessBooks: 'Access to books & records',
    receiveShares: 'Receive profit share',
    participateVotes: 'Participate in votes',
    indemnified: 'Indemnified by LLP',
    separateBusiness: 'Run separate business',
};

const PARTNER_DUTIES_LABELS: Record<string, string> = {
    accountBenefits: 'Account for benefits received',
    indemnifyFraud: 'Indemnify for personal fraud',
    renderAccounts: 'Render accurate accounts',
    actInBestInterest: 'Act in LLP best interest',
    noCompeting: 'No competing business',
    maintainConfidentiality: 'Maintain confidentiality',
};

const formatStateName = (state?: string) =>
    state ? state.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : undefined;

const getDscDinStatus = (director: DirectorInfo): string => {
    const parts: string[] = [];
    if (director.hasDIN) parts.push('Has DIN');
    else if (director.requestDINfromPeko) parts.push('DIN via Peko');
    if (director.hasDSC) parts.push('Has DSC');
    return parts.join(' · ') || 'Pending';
};

const Review = ({ onEditStep }: ReviewProps) => {
    const { values } = useFormikContext<ApplicationPayload>();
    const { entityType, capital } = values;

    const faceValue = capital?.faceValuePerShare || 10;
    const totalShares =
        capital?.authorizedCapital && faceValue > 0
            ? Math.round(capital.authorizedCapital / faceValue)
            : 0;

    const val = values as unknown as Record<string, unknown>;
    const isLLP = entityType === EntityType.LLP;
    const personLabel = isLLP ? 'Partner' : 'Director';

    const hasRegisteredOffice = values.registeredOffice?.availability === 'have';
    const isOwned = values.registeredOffice?.officeType === 'owned';

    let officeDocFields: Array<{ key: string; label: string }> = [];
    if (hasRegisteredOffice) {
        officeDocFields = isOwned
            ? [
                  { key: 'nocFromOwner', label: 'NOC from Owner' },
                  { key: 'titleOrUtilityDoc', label: 'Title Document or Utility Bill' },
              ]
            : [
                  { key: 'nocFromOwner', label: 'NOC from Owner' },
                  { key: 'utilityBill', label: 'Utility Bill' },
                  { key: 'rentOrLeaseDeed', label: 'Rent Deed or Lease Deed' },
              ];
    }

    const directorDocFields: Array<{ key: string; label: string }> = (values.directors || []).flatMap(
        (director, i) => [
            { key: `director_${i}_photo`, label: `${personLabel} ${i + 1} — Photo` },
            ...(director.nationality === 'Indian'
                ? [
                      { key: `director_${i}_proofOfIdentity`, label: `${personLabel} ${i + 1} — Proof of Identity` },
                      { key: `director_${i}_proofOfAddress`, label: `${personLabel} ${i + 1} — Proof of Address` },
                  ]
                : [{ key: `director_${i}_passport`, label: `${personLabel} ${i + 1} — Passport` }]),
        ]
    );

    const allDocFields = [
        ...officeDocFields,
        ...directorDocFields,
        { key: 'nameAvailabilityCertificate', label: 'Name Availability Certificate' },
        { key: 'trademarkCertificate', label: 'Trademark Certificate' },
    ];

    const uploadedDocs = allDocFields.map(({ key, label }) => {
        const entry = val[key];
        const fileName =
            entry && typeof entry === 'object' && 'fileName' in (entry as object)
                ? (entry as { fileName: string }).fileName
                : null;
        return { label, fileName };
    });
    const uploadedCount = uploadedDocs.filter(d => d.fileName).length;

    return (
        <div className="space-y-5">
            {/* Step 0 — Basic Details */}
            <SectionCard title="Applicant & Company Details" step={0} onEditStep={onEditStep}>
                <div>
                    <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
                        Applicant
                    </p>
                    <ReviewGrid>
                        <InfoField label="Full Name" value={values.applicantDetails?.fullName} />
                        <InfoField label="Email" value={values.applicantDetails?.email} />
                        <InfoField label="Mobile" value={values.applicantDetails?.mobile} />
                        <InfoField label="State" value={formatStateName(values.applicantDetails?.state)} />
                    </ReviewGrid>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
                        Company
                    </p>
                    <ReviewGrid>
                        <InfoField
                            label="Entity Type"
                            value={entityType ? (ENTITY_TYPE_LABELS[entityType] ?? entityType) : undefined}
                        />
                        <InfoField label="1st Choice Name" value={values.proposedNames?.firstChoice} />
                        <InfoField label="2nd Choice Name" value={values.proposedNames?.secondChoice} />
                    </ReviewGrid>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
                        Registered Office
                    </p>
                    <ReviewGrid>
                        <InfoField
                            label="Office Availability"
                            value={values.registeredOffice?.availability === 'have' ? 'Already have office' : 'Need office'}
                        />
                        {values.registeredOffice?.availability === 'have' && (
                            <>
                                <InfoField label="Office Type" value={values.registeredOffice?.officeType} />
                                <div className="col-span-2">
                                    <InfoField label="Address" value={values.registeredOffice?.address} />
                                </div>
                            </>
                        )}
                        {entityType === EntityType.LLP && (
                            <InfoField label="State of Registration" value={formatStateName(values.registeredOffice?.state)} />
                        )}
                    </ReviewGrid>
                </div>
            </SectionCard>

            {/* Step 1 — Directors / Partners */}
            <SectionCard
                title={isLLP ? `Designated Partners (${values.directors?.length || 0})` : `Directors (${values.directors?.length || 0})`}
                step={1}
                onEditStep={onEditStep}
            >
                {values.directors && values.directors.length > 0 ? (
                    values.directors.map((director: DirectorInfo, idx: number) => (
                        <div key={idx} className="bg-slate-50 rounded-[12px] p-5 space-y-4">
                            <p className="text-[14px] font-semibold text-gray-700">
                                {personLabel} {idx + 1}{director.name ? ` — ${director.name}` : ''}
                            </p>
                            <ReviewGrid>
                                <InfoField label="Name" value={director.name} />
                                <InfoField label="Nationality" value={director.nationality} />
                                <InfoField label="Email" value={director.email} />
                                <InfoField label="Mobile" value={director.mobile} />
                                {director.nationality === 'Indian' ? (
                                    <InfoField label="PAN" value={director.panNumber} />
                                ) : (
                                    <InfoField label="Passport" value={director.passportNumber} />
                                )}
                                <InfoField label="DIN" value={director.din} />
                                <InfoField label="DSC / DIN Status" value={getDscDinStatus(director)} />
                                <InfoField label="Education" value={director.educationQualification} />
                                <InfoField label="Occupation" value={director.occupation} />
                                {director.nationality === 'Indian' && director.placeOfBirth?.state && (
                                    <InfoField
                                        label="Birth State"
                                        value={formatStateName(director.placeOfBirth.state)}
                                    />
                                )}
                                {director.nationality === 'Indian' && director.placeOfBirth?.district && (
                                    <InfoField label="Birth District" value={director.placeOfBirth.district} />
                                )}
                            </ReviewGrid>
                        </div>
                    ))
                ) : (
                    <p className="text-[14px] text-slate-400">No {personLabel.toLowerCase()}s added</p>
                )}
            </SectionCard>

            {/* Nominee (OPC only) */}
            {entityType === EntityType.OPC && values.nominee && (
                <SectionCard title="Nominee" step={1} onEditStep={onEditStep}>
                    <ReviewGrid>
                        <InfoField label="Name" value={(values.nominee as NomineeInfo).name} />
                        <InfoField label="Nationality" value={(values.nominee as NomineeInfo).nationality} />
                        <InfoField label="Email" value={(values.nominee as NomineeInfo).email} />
                        <InfoField label="Mobile" value={(values.nominee as NomineeInfo).mobile} />
                        {(values.nominee as NomineeInfo).nationality === 'Indian' ? (
                            <InfoField label="PAN" value={(values.nominee as NomineeInfo).panNumber} />
                        ) : (
                            <InfoField label="Passport" value={(values.nominee as NomineeInfo).passportNumber} />
                        )}
                        <InfoField label="DIN" value={(values.nominee as NomineeInfo).din} />
                        <InfoField label="Education" value={(values.nominee as NomineeInfo).educationQualification} />
                        <InfoField label="Occupation" value={(values.nominee as NomineeInfo).occupation} />
                        {(values.nominee as NomineeInfo).placeOfBirth?.state && (
                            <InfoField
                                label="Birth State"
                                value={formatStateName((values.nominee as NomineeInfo).placeOfBirth?.state)}
                            />
                        )}
                        {(values.nominee as NomineeInfo).placeOfBirth?.district && (
                            <InfoField
                                label="Birth District"
                                value={(values.nominee as NomineeInfo).placeOfBirth?.district}
                            />
                        )}
                    </ReviewGrid>
                </SectionCard>
            )}

            {/* Step 2 — Capital */}
            {entityType !== EntityType.LLP ? (
                <SectionCard title="Capital & Shareholding" step={2} onEditStep={onEditStep}>
                    <ReviewGrid>
                        <InfoField
                            label="Authorized Capital"
                            value={`₹${formatNumberWithLocalString(capital?.authorizedCapital || 0, 0, 0)}`}
                        />
                        <InfoField
                            label="Paid-up Capital"
                            value={`₹${formatNumberWithLocalString(capital?.paidUpCapital || 0, 0, 0)}`}
                        />
                        <InfoField label="Face Value per Share" value={`₹${faceValue}`} />
                        <InfoField
                            label="Total Shares"
                            value={totalShares > 0 ? `${formatNumberWithLocalString(totalShares, 0, 0)} shares` : '—'}
                        />
                    </ReviewGrid>

                    {capital?.shareholders && capital.shareholders.length > 0 && (
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                            <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide">
                                Shareholders
                            </p>
                            {capital.shareholders.map((sh, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between bg-slate-50 rounded-[10px] px-4 py-3"
                                >
                                    <span className="text-[15px] font-semibold text-[#27272e]">{sh.name}</span>
                                    <span className="text-[14px] text-slate-600">
                                        {sh.shareholding}%
                                        {totalShares > 0 &&
                                            ` · ${formatNumberWithLocalString(Math.round((sh.shareholding / 100) * totalShares), 0, 0)} shares`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            ) : (
                <SectionCard title="LLP Capital" step={2} onEditStep={onEditStep}>
                    <ReviewGrid>
                        <InfoField
                            label="Initial Capital Contribution"
                            value={values.capital?.authorizedCapital ? `₹${formatNumberWithLocalString(values.capital.authorizedCapital, 0, 0)}` : undefined}
                        />
                    </ReviewGrid>
                </SectionCard>
            )}

            {/* Step 3 — Business Activity */}
            <SectionCard title="Business Activity" step={3} onEditStep={onEditStep}>
                <ReviewGrid>
                    <InfoField label="Section" value={values.businessActivity?.section} />
                    <InfoField label="Division" value={values.businessActivity?.division} />
                    <InfoField label="Group" value={values.businessActivity?.group} />
                    <InfoField label="Class" value={values.businessActivity?.class} />
                    <InfoField label="Subclass" value={values.businessActivity?.subclass} />
                    <div className="col-span-2">
                        <InfoField label="Description" value={values.businessActivity?.description} />
                    </div>
                    {values.businessActivity?.secondaryActivity && (
                        <InfoField label="Secondary Activity" value={values.businessActivity.secondaryActivity} />
                    )}
                    {values.businessActivity?.otherActivities && (
                        <div className="col-span-2">
                            <InfoField label="Other Activities" value={values.businessActivity.otherActivities} />
                        </div>
                    )}
                </ReviewGrid>
            </SectionCard>

            {/* Step 4 — MOA & AOA or LLP Agreement */}
            {entityType !== EntityType.LLP ? (
                <SectionCard title="MOA & AOA" step={4} onEditStep={onEditStep}>
                    <ReviewGrid>
                        <InfoField
                            label="MOA Type"
                            value={values.moaAoa?.moaType === 'standard' ? 'Standard' : 'Custom'}
                        />
                        <InfoField
                            label="AOA Type"
                            value={values.moaAoa?.aoaType === 'standard' ? 'Standard' : 'Customized'}
                        />
                        <InfoField label="Confirmed" value={values.moaAoa?.confirmed} />
                    </ReviewGrid>
                </SectionCard>
            ) : (
                <SectionCard title="LLP Agreement" step={4} onEditStep={onEditStep}>
                    <ReviewGrid>
                        <InfoField
                            label="Agreement Type"
                            value={values.llpAgreement?.agreementType === 'standard' ? 'Standard' : 'Custom'}
                        />
                        <InfoField label="Meeting Quorum" value={values.llpAgreement?.meetingQuorum} />
                        <InfoField label="Voting Threshold" value={values.llpAgreement?.votingThreshold} />
                        <InfoField
                            label="Dispute Resolution"
                            value={values.llpAgreement?.disputeResolution?.method}
                        />
                        {values.llpAgreement?.disputeResolution?.jurisdiction && (
                            <InfoField
                                label="Jurisdiction"
                                value={values.llpAgreement.disputeResolution.jurisdiction}
                            />
                        )}
                    </ReviewGrid>

                    {values.llpAgreement?.partnerRights && (
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
                                Partner Rights
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(values.llpAgreement.partnerRights).map(([key, enabled]) => (
                                    <Tag
                                        key={key}
                                        color={enabled ? 'green' : 'default'}
                                        className="!text-[13px] !px-3 !py-1 !rounded-full"
                                    >
                                        {PARTNER_RIGHTS_LABELS[key] || key}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}

                    {values.llpAgreement?.partnerDuties && (
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-[13px] font-semibold text-slate-600 uppercase tracking-wide mb-3">
                                Partner Duties
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(values.llpAgreement.partnerDuties).map(([key, enabled]) => (
                                    <Tag
                                        key={key}
                                        color={enabled ? 'blue' : 'default'}
                                        className="!text-[13px] !px-3 !py-1 !rounded-full"
                                    >
                                        {PARTNER_DUTIES_LABELS[key] || key}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* Step 5 — Documents */}
            <SectionCard
                title={`Documents (${uploadedCount} / ${uploadedDocs.length} uploaded)`}
                step={5}
                onEditStep={onEditStep}
            >
                <div className="grid grid-cols-2 gap-3">
                    {uploadedDocs.map(doc => (
                        <div
                            key={doc.label}
                            className={`flex items-center gap-3 rounded-[10px] px-4 py-3 border ${
                                doc.fileName ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                            }`}
                        >
                            <FileDoneOutlined
                                className={`text-[16px] shrink-0 ${doc.fileName ? 'text-green-600' : 'text-slate-300'}`}
                            />
                            <div className="min-w-0">
                                <p
                                    className={`text-[13px] font-medium truncate ${
                                        doc.fileName ? 'text-green-700' : 'text-slate-400'
                                    }`}
                                >
                                    {doc.label}
                                </p>
                                {doc.fileName && (
                                    <p className="text-[11px] text-gray-500 truncate">{doc.fileName}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
};

export default Review;
