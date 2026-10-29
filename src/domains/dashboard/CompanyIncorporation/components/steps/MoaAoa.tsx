import { useState } from 'react';

import { BulbOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Input, Radio, RadioChangeEvent, Select, Typography, message } from 'antd';
import { useFormikContext } from 'formik';

import starsIcon from '../../assets/svg/stars.svg';
import { ApplicationPayload } from '../../types';
import {
    ANCILLARY_OBJECTS,
    DEFAULT_CHECKED_ANCILLARY,
    MAIN_OBJECT_PRESETS,
    SECTION_TO_TEMPLATE,
    downloadAsWord,
    generateAoaContent,
    generateMoaContent,
} from '../../utils/moaAoaTemplate';
import PreviewModal from '../PreviewModal';

const { TextArea } = Input;
const { Text } = Typography;

const SECTION_LABELS: Record<string, string> = {
    A: 'Agriculture, Forestry and Fishing',
    B: 'Mining and Quarrying',
    C: 'Manufacturing',
    D: 'Electricity, Gas, Steam and Air Conditioning Supply',
    E: 'Water Supply; Sewerage, Waste Management',
    F: 'Construction',
    G: 'Wholesale and Retail Trade',
    H: 'Transportation and Storage',
    I: 'Accommodation and Food Service Activities',
    J: 'Information and Communication',
    K: 'Financial and Insurance Activities',
    L: 'Real Estate Activities',
    M: 'Professional, Scientific and Technical Activities',
    N: 'Administrative and Support Service Activities',
    O: 'Public Administration and Defence',
    P: 'Education',
    Q: 'Human Health and Social Work Activities',
    R: 'Arts, Entertainment and Recreation',
    S: 'Other Service Activities',
};

const MAIN_OBJECT_OPTIONS = [
    { label: 'Manufacturing & Production', value: 'manufacturing' },
    { label: 'Trading & Distribution', value: 'trading' },
    { label: 'Service Provider', value: 'services' },
    { label: 'Technology & Software', value: 'technology' },
    { label: 'Consulting', value: 'consulting' },
];

const MoaAoa = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<ApplicationPayload>();
    const [moaPreviewOpen, setMoaPreviewOpen] = useState(false);
    const [aoaPreviewOpen, setAoaPreviewOpen] = useState(false);

    const moaAoa = values.moaAoa || {
        moaType: 'standard',
        aoaType: 'standard',
        confirmed: false,
    };

    const { businessActivity } = values;

    const ancillarySelected = moaAoa.ancillaryObjects ?? DEFAULT_CHECKED_ANCILLARY;

    // Auto-detect best template from NIC section if user hasn't manually chosen one
    const autoTemplate = SECTION_TO_TEMPLATE[businessActivity?.section ?? ''] ?? 'services';
    const activeTemplate = moaAoa.mainObjectTemplate ?? autoTemplate;

    // Use user-typed text if available, otherwise fall back to the preset for the active template
    const derivedMainObjectText =
        moaAoa.mainObjectCustomText !== undefined
            ? moaAoa.mainObjectCustomText
            : (MAIN_OBJECT_PRESETS[activeTemplate] ?? '');

    const readFileAsBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

    const handleMoaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            message.error('Only PDF, JPG, JPEG, and PNG files are allowed.');
            e.target.value = '';
            return;
        }
        const fileBase64 = await readFileAsBase64(file);
        setFieldValue('moaAoa.moaFile', file);
        setFieldValue('moaAoa.moaDocument', {
            docType: 'moa_custom',
            fileName: file.name,
            fileBase64,
            mimeType: file.type,
        });
    };

    const handleAoaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            message.error('Only PDF, JPG, JPEG, and PNG files are allowed.');
            e.target.value = '';
            return;
        }
        const fileBase64 = await readFileAsBase64(file);
        setFieldValue('moaAoa.aoaFile', file);
        setFieldValue('moaAoa.aoaDocument', {
            docType: 'aoa_custom',
            fileName: file.name,
            fileBase64,
            mimeType: file.type,
        });
    };

    const handleMoaTypeChange = (e: RadioChangeEvent) => {
        setFieldValue('moaAoa.moaType', e.target.value);
        if (e.target.value !== 'custom') {
            setFieldValue('moaAoa.moaFile', undefined);
            setFieldValue('moaAoa.moaDocument', undefined);
        }
    };

    const handleAoaTypeChange = (e: RadioChangeEvent) => {
        setFieldValue('moaAoa.aoaType', e.target.value);
        if (e.target.value !== 'customized') {
            setFieldValue('moaAoa.aoaFile', undefined);
            setFieldValue('moaAoa.aoaDocument', undefined);
        }
    };

    const handleRemoveMoaFile = () => {
        setFieldValue('moaAoa.moaFile', undefined);
        setFieldValue('moaAoa.moaDocument', undefined);
    };

    const handleRemoveAoaFile = () => {
        setFieldValue('moaAoa.aoaFile', undefined);
        setFieldValue('moaAoa.aoaDocument', undefined);
    };

    const handleMainObjectTemplateChange = (val: string) => {
        setFieldValue('moaAoa.mainObjectTemplate', val);
        // Pre-fill the custom text with the preset for the chosen template
        const preset = MAIN_OBJECT_PRESETS[val];
        if (preset) setFieldValue('moaAoa.mainObjectCustomText', preset);
    };

    const toggleAncillary = (index: number) => {
        const updated = ancillarySelected.includes(index)
            ? ancillarySelected.filter(i => i !== index)
            : [...ancillarySelected, index];
        setFieldValue('moaAoa.ancillaryObjects', updated);
    };

    const showDownloadButtons =
        moaAoa.moaType === 'standard' && moaAoa.aoaType === 'standard' && moaAoa.confirmed;

    // Values to pass into generators — merge derived text so generators see up-to-date state
    const valuesForTemplate: ApplicationPayload = {
        ...values,
        moaAoa: {
            ...moaAoa,
            mainObjectCustomText: derivedMainObjectText,
            ancillaryObjects: ancillarySelected,
        },
    };

    return (
        <div className="space-y-5">
            <div className="bg-white border border-[#e6e3dd] rounded-[36px] shadow-[0px_0px_35px_0px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-8">
                {/* Business Activities auto-fill banner */}
                {moaAoa.moaType === 'standard' && (
                    <div className="bg-[#f8fffc] border border-[#cdf1e2] rounded-[16px] p-4 sm:p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-50 border border-brandGreen rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                                <span className="text-[14px] font-medium text-brandGreen">1</span>
                            </div>
                            <span className="text-[13px] sm:text-[18px] font-medium text-brandGreen">
                                Business Activities Auto-filled from Step 4
                            </span>
                        </div>
                        <div className="space-y-3">
                            <p className="text-[13px] sm:text-[16px] font-semibold text-slate-600">
                                Primary Activity (NIC Code):
                            </p>
                            <div className="bg-white border border-[#cdf1e2] rounded-[16px] p-4 space-y-1">
                                <p className="text-[15px] sm:text-[20px] font-semibold text-slate-800">
                                    {businessActivity?.group || '—'} -
                                </p>
                                <p className="text-[13px] sm:text-[16px] text-slate-800">
                                    Section:{' '}
                                    {businessActivity?.section
                                        ? `${businessActivity.section} - ${SECTION_LABELS[businessActivity.section] || businessActivity.section}`
                                        : '—'}
                                </p>
                                {businessActivity?.division && (
                                    <p className="text-[13px] sm:text-[16px] text-slate-800">
                                        Division: {businessActivity.division}
                                    </p>
                                )}
                                {businessActivity?.group && (
                                    <p className="text-[13px] sm:text-[16px] text-slate-800">
                                        Group: {businessActivity.group}
                                    </p>
                                )}
                                <p className="text-[13px] sm:text-[16px] text-slate-800">
                                    Class: {businessActivity?.class || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MOA Section */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-[18px] font-medium text-black leading-7">
                            Memorandum of Association (MOA)
                        </h3>
                        <p className="text-[14px] text-slate-600 leading-[22px]">
                            The MOA defines the company&#39;s objectives, powers, and scope of
                            operations. It&#39;s a public document.
                        </p>
                    </div>

                    <Radio.Group
                        value={moaAoa.moaType}
                        onChange={handleMoaTypeChange}
                        className="w-full space-y-3"
                    >
                        {/* Standard MOA */}
                        <div className="border border-zinc-200 rounded-[22px] overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6">
                                <div className="flex items-center gap-3">
                                    <Radio value="standard" />
                                    <span className="text-[14px] sm:text-[18px] font-medium text-black">
                                        Standard MOA Template{' '}
                                        <span className="text-[#8b8b8b] font-normal">
                                            (Auto generated)
                                        </span>
                                    </span>
                                </div>
                                <Button
                                    onClick={() => setMoaPreviewOpen(true)}
                                    danger
                                    className="!rounded-[8px] self-start sm:self-auto"
                                >
                                    Preview
                                </Button>
                            </div>

                            {moaAoa.moaType === 'standard' && (
                                <div className="mx-6 mb-6">
                                    <div className="bg-bgBlueFaint border border-bgPeriwinkle rounded-[24px] p-4 sm:p-8 flex flex-col gap-8">
                                        <div className="flex items-center gap-2">
                                            <img src={starsIcon} alt="" className="w-6 h-6" />
                                            <span className="text-[14px] sm:text-[18px] font-medium text-accentBlue">
                                                Auto-Generated MOA Content
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <p className="text-[16px] font-semibold text-neutral-950">
                                                Memorandum &amp; Articles of Association
                                            </p>
                                            <p className="text-[14px] text-slate-500 leading-[22px]">
                                                Define the foundational documents for your company -
                                                MOA outlines objectives, AOA defines internal rules
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <p className="text-[14px] font-medium text-textNearBlack leading-[22px]">
                                                Select main object template
                                            </p>
                                            <Select
                                                options={MAIN_OBJECT_OPTIONS}
                                                value={activeTemplate}
                                                onChange={handleMainObjectTemplateChange}
                                                className="w-full [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-[8px]"
                                                size="large"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <p className="text-[14px] font-medium text-textNearBlack leading-[22px]">
                                                Main Object Clause{' '}
                                                <span className="text-[12px] text-slate-500 font-normal">
                                                    (auto-detected from your business activity —
                                                    edit if needed)
                                                </span>
                                            </p>
                                            <TextArea
                                                value={derivedMainObjectText}
                                                onChange={e =>
                                                    setFieldValue(
                                                        'moaAoa.mainObjectCustomText',
                                                        e.target.value
                                                    )
                                                }
                                                rows={4}
                                                className="!rounded-[8px] !text-[14px]"
                                            />
                                            <p className="text-[12px] text-slate-500 leading-[18px]">
                                                This clause goes into Clause III(a) of your MOA.
                                                Changing the template above will update this text.
                                            </p>
                                        </div>

                                        {/* Ancillary objects list */}
                                        <div className="flex flex-col gap-3">
                                            <p className="text-[14px] font-medium text-textNearBlack leading-[22px]">
                                                Ancillary / Incidental Objects
                                            </p>
                                            <div className="bg-white border border-borderGrayLight rounded-[22px] p-6">
                                                <div className="space-y-4">
                                                    {ANCILLARY_OBJECTS.map((obj, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-4"
                                                        >
                                                            <Checkbox
                                                                checked={ancillarySelected.includes(
                                                                    idx
                                                                )}
                                                                onChange={() =>
                                                                    toggleAncillary(idx)
                                                                }
                                                            />
                                                            <span className="text-[15px] text-black">
                                                                {obj}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#eef3f8] rounded-[14px] p-4 flex items-center gap-4">
                                            <BulbOutlined className="text-slate-600 text-[24px] shrink-0" />
                                            <p className="text-[13px] sm:text-[16px] text-slate-600">
                                                The pre-selected ancillary objects cover the most
                                                common incidental activities for most businesses.
                                                You can select or deselect as needed.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="!border-lightRed !text-lightRed hover:!bg-bgRedLight !rounded-[8px] !h-[40px] sm:!h-[45px] !w-full !mt-4 !font-medium !text-[10px] sm:!text-[12px] lg:!text-[14px] transition-colors"
                                        onClick={() => setMoaPreviewOpen(true)}
                                    >
                                        Preview Your Auto-Generated MOA
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Custom MOA */}
                        <div className="border border-zinc-200 rounded-[16px] overflow-hidden">
                            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-6">
                                <Radio value="custom" />
                                <span className="text-[14px] sm:text-[18px] font-medium text-black">
                                    Custom MOA{' '}
                                    <span className="text-[13px] sm:text-[16px] font-normal text-slate-500">
                                        (Upload your own)
                                    </span>
                                </span>
                            </div>

                            {moaAoa.moaType === 'custom' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-[14px] font-medium text-neutral-900">
                                        Upload Custom MOA Draft
                                    </p>
                                    <div className="border border-dashed border-borderSlateMuted rounded-[10px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
                                        <span className="text-[14px] text-textGreyColor">
                                            Upload PDF, JPG, JPEG, PNG File (Max 5 MB)
                                        </span>
                                        <label
                                            htmlFor="moa-file-upload"
                                            className="bg-bgBlueFaint border border-bgPeriwinkle rounded-[7px] px-4 py-2 cursor-pointer"
                                        >
                                            <span className="text-[14px] font-medium text-accentBlue">
                                                Browse File
                                            </span>
                                            <input
                                                id="moa-file-upload"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleMoaFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {moaAoa.moaFile && (
                                        <div className="flex items-center gap-2">
                                            <p className="text-[12px] text-zinc-600">
                                                Selected: {moaAoa.moaFile.name}
                                            </p>
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<CloseCircleOutlined />}
                                                onClick={handleRemoveMoaFile}
                                                className="!text-[12px]"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                    <Alert
                                        message="Custom MOA requires legal review and may extend processing time by 2-3 business days"
                                        type="warning"
                                        className="!bg-bgCreamLight !border-0 !rounded-[16px]"
                                        showIcon
                                    />
                                </div>
                            )}
                        </div>
                    </Radio.Group>
                </div>

                {/* AOA Section */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-[18px] font-medium text-black leading-7">
                            Articles of Association (AOA)
                        </h3>
                        <p className="text-[14px] text-slate-600 leading-[22px]">
                            The AOA contains rules and regulations for internal management of the
                            company.
                        </p>
                    </div>

                    <Radio.Group
                        value={moaAoa.aoaType}
                        onChange={handleAoaTypeChange}
                        className="w-full space-y-3"
                    >
                        {/* Standard Table F AOA */}
                        <div className="border border-zinc-200 rounded-[16px] px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Radio value="standard" />
                                <div>
                                    <span className="text-[14px] sm:text-[18px] font-medium text-black">
                                        Standard Table F AOA
                                    </span>
                                    <p className="text-[13px] text-slate-500 mt-0.5">
                                        Schedule I, Companies Act 2013 — auto-filled with your
                                        company details
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setAoaPreviewOpen(true)}
                                danger
                                className="!rounded-[8px] self-start sm:self-auto"
                            >
                                Preview
                            </Button>
                        </div>

                        {/* Customized AOA */}
                        <div className="border border-zinc-200 rounded-[16px] overflow-hidden">
                            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-6">
                                <Radio value="customized" />
                                <span className="text-[14px] sm:text-[18px] font-medium text-black">
                                    Customized AOA
                                </span>
                            </div>

                            {moaAoa.aoaType === 'customized' && (
                                <div className="px-6 pb-6 space-y-4">
                                    <p className="text-[14px] font-medium text-neutral-900">
                                        Upload Custom AOA Draft
                                    </p>
                                    <div className="border border-dashed border-borderSlateMuted rounded-[10px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
                                        <span className="text-[14px] text-textGreyColor">
                                            Upload PDF, JPG, JPEG, PNG File (Max 5 MB)
                                        </span>
                                        <label
                                            htmlFor="aoa-file-upload"
                                            className="bg-bgBlueFaint border border-bgPeriwinkle rounded-[7px] px-4 py-2 cursor-pointer"
                                        >
                                            <span className="text-[14px] font-medium text-accentBlue">
                                                Browse File
                                            </span>
                                            <input
                                                id="aoa-file-upload"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleAoaFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    {moaAoa.aoaFile && (
                                        <div className="flex items-center gap-2">
                                            <p className="text-[12px] text-zinc-600">
                                                Selected: {moaAoa.aoaFile.name}
                                            </p>
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<CloseCircleOutlined />}
                                                onClick={handleRemoveAoaFile}
                                                className="!text-[12px]"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                    <Alert
                                        message="Custom AOA requires legal review and may extend processing time by 2-3 business days"
                                        type="warning"
                                        className="!bg-bgCreamLight !border-0 !rounded-[16px]"
                                        showIcon
                                    />
                                </div>
                            )}
                        </div>
                    </Radio.Group>
                </div>

                <hr className="border-borderGrayLight" />

                {/* Confirmation */}
                <div className="space-y-2">
                    <div className="bg-[rgba(37,99,235,0.04)] border border-[rgba(0,0,0,0.04)] rounded-[16px] p-4 flex items-center gap-4">
                        <Checkbox
                            checked={moaAoa.confirmed}
                            onChange={e => setFieldValue('moaAoa.confirmed', e.target.checked)}
                            className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-blue-600 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-blue-600 [&_.ant-checkbox:hover_.ant-checkbox-inner]:!border-blue-600"
                        />
                        <Text className="!text-[13px] sm:!text-[16px] !text-[rgba(37,99,235,0.8)]">
                            I confirm that the selected MOA and AOA templates are appropriate for my
                            business
                        </Text>
                    </div>
                    {(touched as any)?.moaAoa?.confirmed &&
                        (errors as any)?.moaAoa?.confirmed && (
                        <p data-form-error="true" className="text-lightRed text-[12px] ml-1">
                            {(errors as any).moaAoa.confirmed}
                        </p>
                    )}
                </div>

                {/* Download buttons */}
                {showDownloadButtons && (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-8">
                        <Button
                            type="primary"
                            danger
                            icon={<DownloadOutlined />}
                            className="flex-1 !h-[45px] !rounded-[8px] !font-medium"
                            onClick={() =>
                                downloadAsWord(
                                    generateMoaContent(valuesForTemplate),
                                    'MOA_Draft',
                                    'Memorandum of Association'
                                )
                            }
                        >
                            Download MOA
                        </Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            className="flex-1 !h-[45px] !rounded-[8px] !font-medium !bg-lightRed hover:!bg-lightRedHover"
                            onClick={() =>
                                downloadAsWord(
                                    generateAoaContent(valuesForTemplate),
                                    'AOA_Draft',
                                    'Articles of Association'
                                )
                            }
                        >
                            Download AOA
                        </Button>
                    </div>
                )}

                {/* What happens next */}
                <div className="bg-slate-50 rounded-[14px] p-4 sm:p-6 space-y-4">
                    <span className="text-[15px] sm:text-[20px] font-semibold text-slate-800">
                        What happens next?
                    </span>
                    <ul className="list-disc list-inside space-y-3 text-[13px] sm:text-[16px] text-slate-600">
                        <li>Draft MOA and AOA will be prepared based on your inputs</li>
                        <li>You&#39;ll review and approve the drafts before e-filing</li>
                        <li>Both documents will be digitally signed by all directors</li>
                        <li>Final versions will be submitted to MCA as part of SPICe+ form</li>
                    </ul>
                </div>
            </div>

            {/* MOA Preview Modal */}
            <PreviewModal
                visible={moaPreviewOpen}
                title="Memorandum of Association (MOA) — Draft Preview"
                content={generateMoaContent(valuesForTemplate)}
                onClose={() => setMoaPreviewOpen(false)}
            />

            {/* AOA Preview Modal */}
            <PreviewModal
                visible={aoaPreviewOpen}
                title="Articles of Association (AOA) — Standard Table F Preview"
                content={generateAoaContent(valuesForTemplate)}
                onClose={() => setAoaPreviewOpen(false)}
            />
        </div>
    );
};

export default MoaAoa;
