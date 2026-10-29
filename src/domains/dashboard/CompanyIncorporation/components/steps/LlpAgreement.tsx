import { useState } from 'react';

import { CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Checkbox, Radio, RadioChangeEvent, message } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import starsIcon from '../../assets/svg/stars.svg';
import { ApplicationPayload } from '../../types';
import { downloadAsWord, generateLlpAgreementContent } from '../../utils/moaAoaTemplate';
import PreviewModal from '../PreviewModal';

interface LlpAgreementProps {
    onEditStep?: (step: number) => void;
}

const LlpAgreement = ({ onEditStep }: LlpAgreementProps) => {
    const { values, setFieldValue, errors, touched } = useFormikContext<ApplicationPayload>();
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleDownloadDraft = () =>
        downloadAsWord(generateLlpAgreementContent(values), 'LLP_Agreement_Draft', 'LLP Agreement');

    const llpAgreement = values.llpAgreement || {
        agreementType: 'standard',
        partnerRights: {
            accessBooks: true,
            receiveShares: true,
            participateVotes: false,
            indemnified: true,
            separateBusiness: false,
        },
        partnerDuties: {
            accountBenefits: true,
            indemnifyFraud: true,
            renderAccounts: false,
            actInBestInterest: true,
            noCompeting: false,
            maintainConfidentiality: true,
        },
        meetingQuorum: '2',
        votingThreshold: 'Simple Majority (>50%)',
        disputeResolution: { method: 'Arbitration (Recommended)', jurisdiction: '' },
        confirmed: false,
    };

    const directors = values.directors || [];
    const totalCapital = values.capital?.authorizedCapital || 0;
    const partnerCount = directors.length || 1;
    const perPartnerCapital = partnerCount > 0 ? Math.floor(totalCapital / partnerCount) : 0;
    const profitShare = partnerCount > 0 ? Math.floor(100 / partnerCount) : 0;

    const businessDesc = values.businessActivity?.description || '';
    const businessSubclass = values.businessActivity?.subclass || '';
    const businessDisplay = businessSubclass
        ? `${businessSubclass}${businessDesc ? ` – ${businessDesc}` : ''}`
        : businessDesc;

    const handleRightChange = (key: string, checked: boolean) => {
        setFieldValue(`llpAgreement.partnerRights.${key}`, checked);
    };

    const handleDutyChange = (key: string, checked: boolean) => {
        setFieldValue(`llpAgreement.partnerDuties.${key}`, checked);
    };

    const readFileAsBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

    const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            message.error('Only PDF, JPG, JPEG, and PNG files are allowed.');
            e.target.value = '';
            return;
        }
        const fileBase64 = await readFileAsBase64(file);
        setFieldValue('llpAgreement.customAgreementFile', file);
        setFieldValue('llpAgreement.customAgreementDocument', {
            docType: 'llp_agreement_custom',
            fileName: file.name,
            fileBase64,
            mimeType: file.type,
        });
    };

    const handleAgreementTypeChange = (e: RadioChangeEvent) => {
        setFieldValue('llpAgreement.agreementType', e.target.value);
        if (e.target.value !== 'custom') {
            setFieldValue('llpAgreement.customAgreementFile', undefined);
            setFieldValue('llpAgreement.customAgreementDocument', undefined);
        }
    };

    const handleRemoveCustomFile = () => {
        setFieldValue('llpAgreement.customAgreementFile', undefined);
        setFieldValue('llpAgreement.customAgreementDocument', undefined);
    };

    const confirmedError =
        touched.llpAgreement &&
        (errors.llpAgreement as Record<string, string> | undefined)?.confirmed;

    return (
        <div className="space-y-5">
            {/* 1. LLP Agreement Template */}
            <div className="border border-zinc-200 rounded-[22px] p-4 sm:p-6 space-y-6">
                <div className="space-y-1">
                    <p className="text-[18px] font-medium text-black leading-[28px]">
                        LLP Agreement Template
                    </p>
                    <p className="text-[16px] text-slate-500 leading-[28px]">
                        The LLP Agreement is a mandatory document that defines the mutual rights and
                        duties of partners
                    </p>
                </div>

                <Radio.Group
                    value={llpAgreement.agreementType}
                    onChange={handleAgreementTypeChange}
                    className="flex flex-col sm:flex-row gap-3 w-full"
                >
                    <div
                        className={`flex-1 rounded-[16px] p-4 sm:p-6 cursor-pointer transition-all ${
                            llpAgreement.agreementType === 'standard'
                                ? 'border border-lightRed shadow-[0px_1.2px_12px_0px_rgba(0,0,0,0.06)]'
                                : 'border border-borderGrayLight'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Radio value="standard" />
                            <p className="text-[16px] sm:text-[18px] font-medium text-black leading-[28px] flex items-center gap-2 flex-wrap">
                                Standard LLP Agreement
                                <span className="inline-flex items-center gap-1 text-[#8b8b8b] font-normal">
                                    <img src={starsIcon} alt="" className="w-5 h-5" />
                                    (Auto generated)
                                </span>
                            </p>
                        </div>
                    </div>

                    <div
                        className={`flex-1 rounded-[16px] p-4 sm:p-6 cursor-pointer transition-all ${
                            llpAgreement.agreementType === 'custom'
                                ? 'border border-lightRed shadow-[0px_1.2px_12px_0px_rgba(0,0,0,0.06)]'
                                : 'border border-borderGrayLight'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Radio value="custom" />
                            <p className="text-[16px] sm:text-[18px] font-medium text-black leading-[28px]">
                                Custom LLP Agreement
                            </p>
                        </div>
                    </div>
                </Radio.Group>
            </div>

            {/* Custom: Business Activities file upload */}
            {llpAgreement.agreementType === 'custom' && (
                <div className="space-y-3">
                    <p className="text-[18px] font-medium text-black leading-[28px]">
                        Business Activities
                    </p>
                    <div className="border border-dashed border-borderSlateMuted rounded-[10px] flex items-center justify-between px-4 py-3">
                        <span className="text-[14px] text-textGreyColor">
                            Upload PDF, JPG, JPEG, PNG File (Max 5 MB)
                        </span>
                        <label
                            htmlFor="llp-custom-agreement"
                            className="bg-bgBlueFaint border border-bgPeriwinkle rounded-[8px] px-4 py-2 cursor-pointer"
                        >
                            <span className="text-[14px] font-medium text-accentBlue">
                                Browse File
                            </span>
                            <input
                                id="llp-custom-agreement"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleCustomFileUpload}
                                className="sr-only"
                            />
                        </label>
                    </div>
                    {llpAgreement.customAgreementFile && (
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] text-zinc-600">
                                Selected: {llpAgreement.customAgreementFile.name}
                            </p>
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={handleRemoveCustomFile}
                                className="!text-[12px]"
                            >
                                Remove
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Standard-only sections */}
            {llpAgreement.agreementType === 'standard' && (
                <>
                    {/* 2. Partner Configuration */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Partner Configuration
                            </p>
                            <p className="text-[16px] text-slate-500 leading-[28px]">
                                Configure capital contribution and profit sharing for each partner
                            </p>
                        </div>

                        <div className="border border-zinc-200 rounded-[22px] p-4 sm:p-6 space-y-6">
                            {/* Total Capital */}
                            <div className="bg-bgBlueFaint border border-bgPeriwinkle rounded-[24px] p-4 sm:p-6 space-y-3">
                                <p className="text-[16px] font-semibold text-neutral-950">
                                    Total Capital Contribution<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                                </p>
                                <div className="space-y-1">
                                    <div className="bg-white border border-zinc-200 rounded-[8px] h-16 flex items-center px-5 w-full">
                                        <p className="text-[18px] text-zinc-400">
                                            {totalCapital > 0
                                                ? `₹ ${formatNumberWithLocalString(totalCapital, 0, 0)}`
                                                : '₹ 1,00,000'}
                                        </p>
                                    </div>
                                    <p className="text-[12px] text-slate-500">
                                        Minimum recommended: ₹1,00,000 (One Lakh)
                                    </p>
                                </div>
                            </div>

                            {/* Partner cards */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <p className="text-[14px] text-slate-500">
                                        Prefilled from Steps 2 &amp; 3
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            icon={<EditOutlined />}
                                            onClick={() => onEditStep?.(1)}
                                            className="!bg-white !border !border-errorTextRed !text-errorTextRed hover:!bg-bgRedLight !rounded-[8px] !h-auto !px-4 !py-[5px] !font-normal !text-[14px] !shadow-[0px_2px_0px_0px_rgba(0,0,0,0.02)] transition-colors"
                                        >
                                            Edit Partners
                                        </Button>
                                        <Button
                                            icon={<EditOutlined />}
                                            onClick={() => onEditStep?.(2)}
                                            className="!bg-white !border !border-errorTextRed !text-errorTextRed hover:!bg-bgRedLight !rounded-[8px] !h-auto !px-4 !py-[5px] !font-normal !text-[14px] !shadow-[0px_2px_0px_0px_rgba(0,0,0,0.02)] transition-colors"
                                        >
                                            Edit Contribution
                                        </Button>
                                    </div>
                                </div>

                                {directors.length === 0 ? (
                                    <div className="bg-[#f7f7f7] border border-borderGray3 rounded-[16px] p-4">
                                        <p className="text-[14px] text-slate-500">
                                            No partners added yet. Complete Step 2 (Directors)
                                            first.
                                        </p>
                                    </div>
                                ) : (
                                    directors.map((director, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[#f7f7f7] border border-borderGray3 rounded-[16px] p-4 space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-semibold text-slate-600 uppercase tracking-wide">
                                                    Partner {idx + 1}
                                                </p>
                                                <span className="bg-[#ebf2ff] border border-[#dce8ff] text-[rgba(37,99,235,0.8)] text-[12px] px-2 py-[2px] rounded-[6px]">
                                                    Designated
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0">
                                                <div className="flex-1 sm:pr-4">
                                                    <p className="text-[12px] text-slate-500 mb-1">
                                                        Partner Name
                                                    </p>
                                                    <p className="text-[15px] font-semibold text-black leading-[22px] break-words">
                                                        {director.name || '—'}
                                                    </p>
                                                </div>
                                                <div className="flex-1 sm:border-l sm:border-borderGray3 sm:pl-6 border-t border-borderGray3 pt-3 sm:border-t-0 sm:pt-0 w-full sm:w-auto">
                                                    <p className="text-[12px] text-slate-500 mb-1">
                                                        Capital Contribution
                                                    </p>
                                                    <p className="text-[15px] font-semibold text-black leading-[22px]">
                                                        {totalCapital > 0
                                                            ? `₹${formatNumberWithLocalString(perPartnerCapital, 0, 0)}`
                                                            : '—'}
                                                    </p>
                                                </div>
                                                <div className="flex-1 sm:border-l sm:border-borderGray3 sm:pl-6 border-t border-borderGray3 pt-3 sm:border-t-0 sm:pt-0 w-full sm:w-auto">
                                                    <p className="text-[12px] text-slate-500 mb-1">
                                                        Profit Share
                                                    </p>
                                                    <p className="text-[15px] font-semibold text-black leading-[22px]">
                                                        {`${profitShare}%`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Business Activities */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Business Activities
                            </p>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => onEditStep?.(3)}
                                className="!bg-white !border !border-errorTextRed !text-errorTextRed hover:!bg-bgRedLight !rounded-[8px] !h-auto !px-4 !py-[5px] !font-normal !text-[14px] !shadow-[0px_2px_0px_0px_rgba(0,0,0,0.02)] !self-start sm:!self-auto transition-colors"
                            >
                                Edit Info
                            </Button>
                        </div>
                        <div className="bg-[#f7f7f7] border border-borderGray3 rounded-[16px] p-4 space-y-2">
                            <p className="text-[12px] text-slate-500">
                                Prefilled from Step 4
                            </p>
                            <p className="text-[15px] font-semibold text-black leading-[22px] break-words">
                                {businessDisplay || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-200" />

                    {/* 4. Rights of Partners */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Rights of Partners<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                            </p>
                            <p className="text-[16px] text-slate-500 leading-[28px]">
                                Select the standard rights that partners will have in the LLP
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-[24px] p-6 space-y-4">
                            {[
                                {
                                    key: 'accessBooks',
                                    label: 'Access books of account and records at any reasonable time',
                                },
                                {
                                    key: 'receiveShares',
                                    label: 'Receive their share of profits as per the agreement',
                                },
                                {
                                    key: 'participateVotes',
                                    label: 'Participate in meetings and vote on resolutions',
                                },
                                {
                                    key: 'indemnified',
                                    label: 'Be indemnified by the LLP for acts done in good faith',
                                },
                                {
                                    key: 'separateBusiness',
                                    label: 'Carry on separate business with prior intimation to LLP',
                                },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center gap-4">
                                    <Checkbox
                                        checked={
                                            llpAgreement.partnerRights[
                                                key as keyof typeof llpAgreement.partnerRights
                                            ]
                                        }
                                        onChange={e => handleRightChange(key, e.target.checked)}
                                    />
                                    <p className="text-[16px] text-black leading-[24px]">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-200" />

                    {/* 5. Duties of Partners */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Duties of Partners<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
                            </p>
                            <p className="text-[16px] text-slate-500 leading-[28px]">
                                Select the standard duties that partners must fulfill
                            </p>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-[24px] p-6 space-y-4">
                            {[
                                {
                                    key: 'accountBenefits',
                                    label: 'Account to the LLP for any benefit derived without consent',
                                },
                                {
                                    key: 'indemnifyFraud',
                                    label: 'Indemnify the LLP for any loss caused by fraud',
                                },
                                {
                                    key: 'renderAccounts',
                                    label: 'Render true accounts and full information affecting the LLP',
                                },
                                {
                                    key: 'actInBestInterest',
                                    label: 'Act in the best interests of the LLP at all times',
                                },
                                {
                                    key: 'noCompeting',
                                    label: 'Not engage in competing business without written consent',
                                },
                                {
                                    key: 'maintainConfidentiality',
                                    label: 'Maintain strict confidentiality of LLP information',
                                },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center gap-4">
                                    <Checkbox
                                        checked={
                                            llpAgreement.partnerDuties[
                                                key as keyof typeof llpAgreement.partnerDuties
                                            ]
                                        }
                                        onChange={e => handleDutyChange(key, e.target.checked)}
                                    />
                                    <p className="text-[16px] text-black leading-[24px]">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-200" />

                    {/* 6. Management & Meetings */}
                    <div className="border border-zinc-200 rounded-[22px] p-4 sm:p-6 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Management &amp; Meetings
                            </p>
                            <p className="text-[16px] text-slate-500 leading-[28px]">
                                Configure how decisions will be made in the LLP
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-[60px]">
                            <SelectInput
                                name="llpAgreement.meetingQuorum"
                                label={
                                    <span>
                                        Meeting Quorum{' '}
                                        <span className="text-slate-600 font-normal">
                                            (minimum partners required)
                                        </span>
                                    </span>
                                }
                                placeholder="Select quorum"
                                size="large"
                                options={[
                                    { label: '1 Partner', value: '1' },
                                    { label: '2 Partners', value: '2' },
                                    { label: '3 Partners', value: '3' },
                                    { label: '50% of Partners', value: '50%' },
                                    { label: 'All Partners', value: 'all' },
                                ]}
                                isRequired
                            />
                            <SelectInput
                                name="llpAgreement.votingThreshold"
                                label="Voting Threshold for Decisions"
                                placeholder="Select threshold"
                                size="large"
                                options={[
                                    { label: 'Simple Majority (>50%)', value: 'Simple Majority (>50%)' },
                                    { label: 'Unanimous Consent', value: 'Unanimous Consent' },
                                    { label: 'Two-thirds Majority', value: 'Two-thirds Majority' },
                                    { label: 'Three-quarters Majority', value: 'Three-quarters Majority' },
                                ]}
                                isRequired
                            />
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-slate-200" />

                    {/* 7. Dispute Resolution */}
                    <div className="border border-zinc-200 rounded-[22px] p-4 sm:p-6 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[18px] font-medium text-black leading-[28px]">
                                Dispute Resolution
                            </p>
                            <p className="text-[16px] text-slate-500 leading-[28px]">
                                Define how disputes between partners will be resolved
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-[60px]">
                            <SelectInput
                                name="llpAgreement.disputeResolution.method"
                                label="Dispute Resolution Method"
                                placeholder="Select method"
                                size="large"
                                options={[
                                    { label: 'Arbitration (Recommended)', value: 'Arbitration (Recommended)' },
                                    { label: 'Mediation', value: 'Mediation' },
                                    { label: 'Court Litigation', value: 'Court Litigation' },
                                    { label: 'Negotiation', value: 'Negotiation' },
                                ]}
                                isRequired
                            />
                            <TextInput
                                name="llpAgreement.disputeResolution.jurisdiction"
                                label="Jurisdiction"
                                type="text"
                                placeholder="e.g., Delhi, Mumbai"
                                size="large"
                                isRequired
                            />
                        </div>
                    </div>

                    {/* 8. Preview + Download buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <Button
                            onClick={() => setPreviewOpen(true)}
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                        stroke="#ff4f4f"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <polyline
                                        points="14,2 14,8 20,8"
                                        stroke="#ff4f4f"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            }
                            danger
                            className="!flex-1 !h-[45px] !text-[14px] sm:!text-[16px] !rounded-[8px]"
                        >
                            Preview Your LLP Agreement
                        </Button>
                        <Button
                            type="primary"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <polyline
                                        points="7,10 12,15 17,10"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <line
                                        x1="12"
                                        y1="15"
                                        x2="12"
                                        y2="3"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            }
                            className="!flex-1 !h-[45px] !text-[14px] sm:!text-[16px] !font-medium !bg-lightRed hover:!bg-lightRedHover !border-lightRed !rounded-[8px] transition-colors"
                            onClick={handleDownloadDraft}
                        >
                            Download Draft Agreement
                        </Button>
                    </div>
                </>
            )}

            {/* Separator */}
            <div className="border-t border-slate-200" />

            {/* Confirmation */}
            <div
                className={`bg-[rgba(37,99,235,0.04)] border rounded-[16px] p-4 flex items-start gap-4 ${
                    confirmedError ? 'border-lightRed' : 'border-[rgba(0,0,0,0.04)]'
                }`}
            >
                <Checkbox
                    checked={llpAgreement.confirmed}
                    onChange={e => setFieldValue('llpAgreement.confirmed', e.target.checked)}
                    className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-blue-600 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-blue-600 [&_.ant-checkbox:hover_.ant-checkbox-inner]:!border-blue-600"
                >
                    <div className="flex-1 space-y-2">
                        <p className="text-[13px] sm:text-[16px] text-[rgba(37,99,235,0.8)] leading-[20px] sm:leading-[24px]">
                            I understand that this is a draft LLP Agreement. The final agreement
                            will be reviewed and finalized by legal professionals before submission
                            to the Ministry of Corporate Affairs (MCA).
                        </p>

                        {confirmedError && (
                            <p data-form-error="true" className="text-lightRed text-[12px]">{confirmedError}</p>
                        )}
                    </div>
                </Checkbox>
            </div>

            {/* Preview Modal */}
            <PreviewModal
                visible={previewOpen}
                title="LLP Agreement Preview"
                content={`LIMITED LIABILITY PARTNERSHIP AGREEMENT\n\nThis is a summary of your customized LLP Agreement\n\nPARTNERS\n\n${directors
                    .map(
                        (d, i) =>
                            `Partner ${i + 1} (Designated) – ${d.name || '--'}\nContribution: ₹${formatNumberWithLocalString(perPartnerCapital, 0, 0)}\nProfit Share: ${profitShare}%`
                    )
                    .join(
                        '\n\n'
                    )}\n\nBUSINESS ACTIVITIES\n\n${businessDisplay || '--'}\n\nPARTNER RIGHTS\n\n${[
                    llpAgreement.partnerRights.accessBooks &&
                        '• Access books of account and records at any reasonable time',
                    llpAgreement.partnerRights.receiveShares &&
                        '• Receive their share of profits as per the agreement',
                    llpAgreement.partnerRights.participateVotes &&
                        '• Participate in meetings and vote on resolutions',
                    llpAgreement.partnerRights.indemnified &&
                        '• Be indemnified by the LLP for acts done in good faith',
                    llpAgreement.partnerRights.separateBusiness &&
                        '• Carry on separate business with prior intimation to LLP',
                ]
                    .filter(Boolean)
                    .join('\n')}\n\nPARTNER DUTIES\n\n${[
                    llpAgreement.partnerDuties.accountBenefits &&
                        '• Account to the LLP for any benefit derived without consent',
                    llpAgreement.partnerDuties.indemnifyFraud &&
                        '• Indemnify the LLP for any loss caused by fraud',
                    llpAgreement.partnerDuties.renderAccounts &&
                        '• Render true accounts and full information affecting the LLP',
                    llpAgreement.partnerDuties.actInBestInterest &&
                        '• Act in the best interests of the LLP at all times',
                    llpAgreement.partnerDuties.noCompeting &&
                        '• Not engage in competing business without written consent',
                    llpAgreement.partnerDuties.maintainConfidentiality &&
                        '• Maintain strict confidentiality of LLP information',
                ]
                    .filter(Boolean)
                    .join(
                        '\n'
                    )}\n\nMANAGEMENT\n\nMeeting Quorum: ${llpAgreement.meetingQuorum} Partner(s)\nVoting Threshold: ${llpAgreement.votingThreshold}\n\nNOTE: This is a draft preview. The final LLP Agreement will be prepared by legal professionals.`}
                onClose={() => setPreviewOpen(false)}
            />
        </div>
    );
};

export default LlpAgreement;
