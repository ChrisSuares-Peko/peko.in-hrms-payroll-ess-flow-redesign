/* eslint-disable react/prop-types */
import { useState } from 'react';

import { PlusOutlined, DownOutlined, ExclamationCircleFilled, DeleteOutlined } from '@ant-design/icons';
import { Button, Row, Col, Checkbox, Switch, Select } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { ApplicationPayload, DirectorInfo, EntityType, NomineeInfo } from '../../types';
import { INDIA_STATES, stateFilterOption } from '../../utils/data';

interface DirectorsProps {
    entityType?: string;
}

const nationalityOptions = [
    { label: 'Indian', value: 'Indian' },
    { label: 'Foreign National', value: 'Foreign National' },
];

const emptyNominee = (): NomineeInfo => ({
    name: '',
    nationality: '',
    email: '',
    mobile: '',
    panNumber: '',
    passportNumber: '',
    din: '',
    hasDIN: false,
    requestDINfromPeko: false,
    educationQualification: '',
    occupation: '',
    placeOfBirth: { state: '', district: '' },
});

const emptyDirector = (): DirectorInfo => ({
    name: '',
    nationality: '',
    email: '',
    mobile: '',
    panNumber: '',
    passportNumber: '',
    din: '',
    hasDIN: false,
    hasDSC: false,
    requestDINfromPeko: false,
    requestDSCfromPeko: false,
    educationQualification: '',
    occupation: '',
    placeOfBirth: { state: '', district: '' },
});

interface WarningBoxProps {
    items: string[];
}

const WarningBox: React.FC<WarningBoxProps> = ({ items }) => (
    <div className="bg-bgCreamLight flex gap-2 items-start px-4 py-[10px] rounded-[16px]">
        <ExclamationCircleFilled className="text-[#faad14] mt-[3px] shrink-0 text-[16px]" />
        <div className="text-[14px] text-[rgba(0,0,0,0.85)] leading-[22px]">
            <span className="font-medium">Important Requirements:</span>
            {items.map((item, i) => (
                <div key={i}>• {item}</div>
            ))}
        </div>
    </div>
);

interface DscDinRowsProps {
    fieldPrefix: string;
    hasDSC: boolean;
    requestDINfromPeko: boolean;
    requestDSCfromPeko: boolean;
    onDINChange: (checked: boolean) => void;
    onDSCToggle: (checked: boolean) => void;
    onDSCCheckboxChange: (checked: boolean) => void;
}

const DscDinRows: React.FC<DscDinRowsProps> = ({
    fieldPrefix,
    hasDSC,
    requestDINfromPeko,
    requestDSCfromPeko,
    onDINChange,
    onDSCToggle,
    onDSCCheckboxChange,
}) => {
    const { errors, touched } = useFormikContext<ApplicationPayload>();
    const dscErrPath = `${fieldPrefix}.requestDSCfromPeko`;
    const dscError = !hasDSC && getIn(touched, dscErrPath) ? getIn(errors, dscErrPath) : undefined;

    return (
        <div className="mt-6 flex flex-col gap-3">
            <div className="border border-borderGrayLight rounded-[12px] p-3">
                <div className="flex gap-3 items-start">
                    <Checkbox
                        checked={requestDINfromPeko}
                        onChange={e => onDINChange(e.target.checked)}
                        className="mt-[2px]"
                    />
                    <div>
                        <div className="text-[14px] text-black leading-[20px] tracking-[0.14px]">
                            I don&apos;t have a DIN. Request Peko to apply on my behalf
                        </div>
                        <div className="text-[12px] text-slate-500 leading-[18px] tracking-[0.12px]">
                            Processing time: 5-7 business days
                        </div>
                    </div>
                </div>
            </div>

            <div className="border border-borderGrayLight rounded-[12px] px-4 py-3">
                <div className="flex justify-between items-center gap-4">
                    <div>
                        <div className="text-[14px] text-black leading-[20px] tracking-[0.14px]">
                            Has Digital Signature Certificate (DSC)?
                        </div>
                        <div className="text-[12px] text-slate-500 leading-[18px] tracking-[0.12px]">
                            Required for company incorporation
                        </div>
                    </div>
                    <Switch checked={hasDSC} onChange={onDSCToggle} />
                </div>
            </div>

            {!hasDSC && (
                <div className="border border-borderGrayLight rounded-[12px] p-3">
                    <div className="flex gap-3 items-start">
                        <Checkbox
                            checked={requestDSCfromPeko}
                            onChange={e => onDSCCheckboxChange(e.target.checked)}
                            className="mt-[2px]"
                        />
                        <div>
                            <div className="text-[14px] text-black leading-[20px] tracking-[0.14px]">
                                I don&apos;t have a DSC. Request Peko to apply on my behalf
                            </div>
                            <div className="text-[12px] text-slate-500 leading-[18px] tracking-[0.12px]">
                                Processing time: 5-7 business days
                            </div>
                        </div>
                    </div>
                    {dscError && (
                        <p data-form-error="true" className="text-lightRed text-[12px] mt-2 ml-7">{dscError}</p>
                    )}
                </div>
            )}
        </div>
    );
};

interface NomineeDinRowProps {
    requestDINfromPeko: boolean;
    onDINChange: (checked: boolean) => void;
}

const NomineeDinRow: React.FC<NomineeDinRowProps> = ({ requestDINfromPeko, onDINChange }) => (
    <div className="mt-6">
        <div className="border border-borderGrayLight rounded-[12px] p-3">
            <div className="flex gap-3 items-start">
                <Checkbox
                    checked={requestDINfromPeko}
                    onChange={e => onDINChange(e.target.checked)}
                    className="mt-[2px]"
                />
                <div>
                    <div className="text-[14px] text-black leading-[20px] tracking-[0.14px]">
                        I don&apos;t have a DIN. Request Peko to apply on my behalf
                    </div>
                    <div className="text-[12px] text-slate-500 leading-[18px] tracking-[0.12px]">
                        Processing time: 5-7 business days
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const renderIdField = (director: DirectorInfo | NomineeInfo, prefix: string): React.ReactNode => {
    if (director.nationality === 'Indian') {
        return (
            <Col xs={24} md={12}>
                <TextInput
                    label="PAN"
                    name={`${prefix}.panNumber`}
                    type="text"
                    placeholder="Enter PAN"
                    maxLength={10}
                    convertToUppercase
                    allowAlphabetsAndNumbersOnly
                    isRequired
                />
            </Col>
        );
    }
    if (director.nationality) {
        return (
            <Col xs={24} md={12}>
                <TextInput
                    label="Passport Number"
                    name={`${prefix}.passportNumber`}
                    type="text"
                    placeholder="Enter passport number"
                    maxLength={20}
                    convertToUppercase
                    allowAlphabetsAndNumbersOnly
                    isRequired
                />
            </Col>
        );
    }
    return null;
};

interface DirectorFieldsProps {
    director: DirectorInfo | NomineeInfo;
    prefix: string;
}

const DirectorFields: React.FC<DirectorFieldsProps> = ({ director, prefix }) => (
    <Row gutter={[60, 16]}>
        <Col xs={24} md={12}>
            <TextInput
                label="Name"
                name={`${prefix}.name`}
                type="text"
                placeholder="Enter full name"
                allowAlphabetsAndSpaceOnly
                isRequired
            />
        </Col>
        <Col xs={24} md={12}>
            <SelectInput
                label="Nationality"
                name={`${prefix}.nationality`}
                options={nationalityOptions}
                placeholder="Select Nationality"
                isRequired
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                label="Email address"
                name={`${prefix}.email`}
                type="text"
                placeholder="Enter email address"
                isRequired
            />
        </Col>
        <Col xs={24} md={12}>
            <TextInput
                label="Mobile Number"
                name={`${prefix}.mobile`}
                type="text"
                placeholder="Mobile Number"
                allowNumbersOnly
                maxLength={10}
                isRequired
            />
        </Col>

        {/* PAN (Indian) or Passport (Foreign National) */}
        {renderIdField(director, prefix)}

        {/* Education Qualification */}
        <Col xs={24} md={12}>
            <TextInput
                label="Education Qualification"
                name={`${prefix}.educationQualification`}
                type="text"
                placeholder="e.g. B.Com, MBA, B.Tech"
                isRequired
            />
        </Col>

        {/* Occupation */}
        <Col xs={24} md={12}>
            <TextInput
                label="Occupation"
                name={`${prefix}.occupation`}
                type="text"
                placeholder="e.g. Business, Service, Professional"
                isRequired
            />
        </Col>

        {/* Place of Birth — Indian Nationals only */}
        {director.nationality === 'Indian' && (
            <>
                <Col xs={24} md={12}>
                    <SelectInput
                        label="Place of Birth — State"
                        name={`${prefix}.placeOfBirth.state`}
                        options={INDIA_STATES}
                        placeholder="Select state"
                        isRequired
                        showSearch
                        filterOption={stateFilterOption}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        label="Place of Birth — District"
                        name={`${prefix}.placeOfBirth.district`}
                        type="text"
                        placeholder="e.g. Pune"
                        isRequired
                    />
                </Col>
            </>
        )}

        {/* DIN — optional, always last */}
        <Col xs={24} md={12}>
            <TextInput
                label={
                    <span>
                        DIN{' '}
                        <span className="text-slate-500 font-normal">(optional)</span>
                    </span>
                }
                name={`${prefix}.din`}
                type="text"
                placeholder="Enter DIN"
                allowNumbersOnly
                maxLength={8}
            />
        </Col>
    </Row>
);

const Directors: React.FC<DirectorsProps> = ({ entityType }) => {
    const { values, errors, touched, setFieldValue } = useFormikContext<ApplicationPayload>();

    const directors = values.directors || [];
    const additionalShareholders = values.additionalShareholders || [];
    const maxAdditionalShareholders = entityType === EntityType.OPC ? 1 : null;

    const getMinDirectors = (): number => {
        if (entityType === EntityType.OPC) return 1;
        if (entityType === EntityType.LLP) return 2;
        if (entityType === EntityType.PUBLIC_LIMITED) return 3;
        return 2; // Private Limited
    };

    const getMaxDirectors = (): number => (entityType === EntityType.OPC ? 1 : 15);
    const minDirectors = getMinDirectors();
    const maxDirectors = getMaxDirectors();

    const [expandedDirectors, setExpandedDirectors] = useState<boolean[]>(() =>
        Array.from({ length: directors.length }, (_, i) => i === 0)
    );
    const [expandedShareholders, setExpandedShareholders] = useState<boolean[]>(() =>
        Array.from({ length: additionalShareholders.length }, (_, i) => i === 0)
    );

    const toggleDirector = (i: number) =>
        setExpandedDirectors(prev => prev.map((v, idx) => (idx === i ? !v : v)));

    const toggleShareholder = (i: number) =>
        setExpandedShareholders(prev => prev.map((v, idx) => (idx === i ? !v : v)));

    const handleAddDirector = () => {
        if (directors.length < maxDirectors) {
            setFieldValue('directors', [...directors, emptyDirector()]);
            setExpandedDirectors(prev => [...prev, true]);
        }
    };

    const handleAddShareholder = () => {
        if (maxAdditionalShareholders !== null && additionalShareholders.length >= maxAdditionalShareholders) {
            return;
        }
        setFieldValue('additionalShareholders', [...additionalShareholders, emptyDirector()]);
        setExpandedShareholders(prev => [...prev, true]);
    };

    const handleRemoveDirector = (index: number) => {
        const updated = directors.filter((_, i) => i !== index);
        setFieldValue('directors', updated);
        setExpandedDirectors(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveAdditionalShareholder = (index: number) => {
        const updated = additionalShareholders.filter((_, i) => i !== index);
        setFieldValue('additionalShareholders', updated);
        setExpandedShareholders(prev => prev.filter((_, i) => i !== index));
    };

    // ============ OPC ============
    if (entityType === EntityType.OPC) {
        const director = directors[0] || emptyDirector();
        return (
            <div className="flex flex-col gap-5">
                {/* Director Details */}
                <div>
                    <div className="text-[18px] font-medium text-black mb-6">Director Details</div>
                    <div className="border border-zinc-200 rounded-[22px] p-6">
                        <DirectorFields director={director} prefix="directors.0" />

                        <DscDinRows
                            fieldPrefix="directors.0"
                            hasDSC={director.hasDSC}
                            requestDINfromPeko={director.requestDINfromPeko}
                            requestDSCfromPeko={director.requestDSCfromPeko ?? false}
                            onDINChange={v => setFieldValue('directors.0.requestDINfromPeko', v)}
                            onDSCToggle={v => {
                                setFieldValue('directors.0.hasDSC', v);
                                if (v) setFieldValue('directors.0.requestDSCfromPeko', false);
                            }}
                            onDSCCheckboxChange={v => setFieldValue('directors.0.requestDSCfromPeko', v)}
                        />
                    </div>
                </div>

                {/* Shareholder — an OPC has a single member, who may differ from the director */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="text-[18px] font-medium text-black">
                                Shareholder{' '}
                                <span className="text-[#8b8b8b]">(Optional)</span>
                            </div>
                            <p className="text-[13px] text-slate-500 mt-1">
                                An OPC has a single shareholder. By default the director is the shareholder — add one here only if the shareholder is a different person.
                            </p>
                        </div>
                        {(maxAdditionalShareholders === null || additionalShareholders.length < maxAdditionalShareholders) && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddShareholder}
                                className="!bg-lightRed hover:!bg-lightRedHover !border-lightRed !h-[48px] !px-5 !rounded-[7px] !text-[16px] transition-colors"
                            >
                                Add Shareholder
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {additionalShareholders.map((shareholder, index) => {
                            const isExpanded = expandedShareholders[index] ?? true;
                            return (
                                <div key={index} className="border border-zinc-200 rounded-[22px] p-6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[18px] font-medium text-black">
                                            Shareholder Details
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemoveAdditionalShareholder(index)}
                                            />
                                            <Button
                                                type="text"
                                                icon={<DownOutlined className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
                                                onClick={() => toggleShareholder(index)}
                                                className="hover:!bg-slate-100 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isExpanded ? 'max-h-[2000px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'
                                        }`}
                                    >
                                        <div>
                                            <Row gutter={[60, 16]}>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        label="Full name"
                                                        name={`additionalShareholders.${index}.name`}
                                                        type="text"
                                                        placeholder="Enter full name"
                                                        isRequired
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <SelectInput
                                                        label="Nationality"
                                                        name={`additionalShareholders.${index}.nationality`}
                                                        options={nationalityOptions}
                                                        placeholder="Select Nationality"
                                                        isRequired
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        label="Email address"
                                                        name={`additionalShareholders.${index}.email`}
                                                        type="text"
                                                        placeholder="Select email address"
                                                        isRequired
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        label="Mobile Number"
                                                        name={`additionalShareholders.${index}.mobile`}
                                                        type="text"
                                                        placeholder="Mobile Number"
                                                        maxLength={10}
                                                        isRequired
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <TextInput
                                                        label="PAN"
                                                        name={`additionalShareholders.${index}.panNumber`}
                                                        type="text"
                                                        placeholder="Enter PAN"
                                                        isRequired
                                                        convertToUppercase
                                                        allowAlphabetsAndNumbersOnly
                                                    />
                                                </Col>
                                            </Row>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Nominee Details */}
                <div>
                    <div className="text-[18px] font-medium text-black mb-1">Nominee Details</div>
                    <p className="text-[13px] text-slate-500 mb-6">
                        Required by law — takes over the company if the sole director is unable to continue.
                    </p>
                    <div className="border border-zinc-200 rounded-[22px] p-6">
                        <DirectorFields
                            director={values.nominee || emptyNominee()}
                            prefix="nominee"
                        />
                        <NomineeDinRow
                            requestDINfromPeko={values.nominee?.requestDINfromPeko ?? false}
                            onDINChange={v => setFieldValue('nominee.requestDINfromPeko', v)}
                        />
                    </div>
                </div>

                <WarningBox
                    items={[
                        'An OPC has exactly 1 director and exactly 1 shareholder (the member)',
                        'By default the director is the shareholder; you may instead add a single different person as the shareholder',
                        'Additional shareholders can be added, but they will not have director rights',
                        'The director must have a Digital Signature Certificate (DSC) — required for document signing',
                        // 'The director must have or apply for a Director Identification Number (DIN)',
                        'A nominee must be appointed — they hold no shares and only take over if the member can no longer continue',
                    ]}
                />
            </div>
        );
    }

    // ============ LLP ============
    if (entityType === EntityType.LLP) {
        return (
            <div className="flex flex-col gap-5">
                {/* Designated Partner Details */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-[18px] font-medium text-black">Designated Partner Details</div>
                        {directors.length < maxDirectors && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddDirector}
                                className="!bg-lightRed hover:!bg-lightRedHover !border-lightRed !h-[48px] !px-5 !rounded-[7px] !text-[16px] transition-colors"
                            >
                                Add Partner
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        {directors.map((director, index) => {
                            const isExpanded = expandedDirectors[index] ?? true;
                            return (
                                <div key={index} className="border border-zinc-200 rounded-[22px] p-6">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[18px] font-medium text-black">
                                            Partner {index + 1}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {directors.length > minDirectors && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleRemoveDirector(index)}
                                                />
                                            )}
                                            <Button
                                                type="text"
                                                icon={<DownOutlined className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
                                                onClick={() => toggleDirector(index)}
                                                className="hover:!bg-slate-100 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                            isExpanded ? 'max-h-[2000px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'
                                        }`}
                                    >
                                        <DirectorFields
                                            director={director}
                                            prefix={`directors.${index}`}
                                        />

                                        <DscDinRows
                                            fieldPrefix={`directors.${index}`}
                                            hasDSC={director.hasDSC}
                                            requestDINfromPeko={director.requestDINfromPeko}
                                            requestDSCfromPeko={director.requestDSCfromPeko ?? false}
                                            onDINChange={v =>
                                                setFieldValue(
                                                    `directors.${index}.requestDINfromPeko`,
                                                    v
                                                )
                                            }
                                            onDSCToggle={v => {
                                                setFieldValue(`directors.${index}.hasDSC`, v);
                                                if (v) setFieldValue(`directors.${index}.requestDSCfromPeko`, false);
                                            }}
                                            onDSCCheckboxChange={v =>
                                                setFieldValue(`directors.${index}.requestDSCfromPeko`, v)
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {touched.directors && directors.length < minDirectors && (
                        <p data-form-error="true" className="text-lightRed text-[12px] mt-4">
                            At least {minDirectors} designated partners are required for LLP
                        </p>
                    )}
                </div>

                <WarningBox
                    items={[
                        'All designated partners must have a Digital Signature Certificate (DSC)',
                        // 'All designated partners must have or apply for a Designated Partner Identification Number (DPIN)',
                        'Foreign partners require additional documentation and review',
                    ]}
                />
            </div>
        );
    }

    // ============ PRIVATE / PUBLIC LIMITED ============
    return (
        <div className="flex flex-col gap-5">
            {/* Number of Directors */}
            <div>
                <div className="text-[18px] font-medium text-black mb-1">
                    Number of Directors<span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>{' '}
                    <span className="text-[14px] text-slate-500 font-normal">
                        (Minimum {minDirectors} directors required)
                    </span>
                </div>
                <Select
                    className="w-full mt-3"
                    placeholder="Select Number"
                    size="large"
                    value={directors.length >= minDirectors ? directors.length : undefined}
                    options={Array.from({ length: maxDirectors - minDirectors + 1 }, (_, i) => ({
                        label: String(minDirectors + i),
                        value: minDirectors + i,
                    }))}
                    onChange={value => {
                        const currentCount = directors.length;
                        if (value > currentCount) {
                            const newDirectors = [...directors];
                            for (let i = currentCount; i < value; i += 1) {
                                newDirectors.push(emptyDirector());
                            }
                            setFieldValue('directors', newDirectors);
                            setExpandedDirectors(newDirectors.map((_, i) => i === 0));
                        } else if (value < currentCount) {
                            setFieldValue('directors', directors.slice(0, value));
                            setExpandedDirectors(prev => prev.slice(0, value));
                        }
                    }}
                    status={
                        touched.directors && typeof errors.directors === 'string'
                            ? 'error'
                            : undefined
                    }
                />
                {touched.directors && typeof errors.directors === 'string' && (
                    <p data-form-error="true" className="text-lightRed text-[12px] mt-1">{errors.directors}</p>
                )}
            </div>

            {/* Director Details */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[18px] font-medium text-black">Director Details</div>
                    {directors.length < maxDirectors && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddDirector}
                            className="!bg-lightRed hover:!bg-lightRedHover !border-lightRed !h-[48px] !px-5 !rounded-[7px] !text-[16px] transition-colors"
                        >
                            Add Director
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {directors.map((director, index) => {
                        const isExpanded = expandedDirectors[index] ?? true;
                        return (
                            <div key={index} className="border border-borderGrayLight rounded-[16px] p-8">
                                <div className="flex justify-between items-center">
                                    <div className="text-[18px] font-medium text-black">
                                        Director {index + 1}
                                    </div>
                                    <Button
                                        type="text"
                                        icon={<DownOutlined className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
                                        onClick={() => toggleDirector(index)}
                                        className="hover:!bg-slate-100 transition-colors"
                                    />
                                </div>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        isExpanded ? 'max-h-[2000px] opacity-100 mt-8' : 'max-h-0 opacity-0 mt-0'
                                    }`}
                                >
                                    <DirectorFields
                                        director={director}
                                        prefix={`directors.${index}`}
                                    />

                                    <DscDinRows
                                        fieldPrefix={`directors.${index}`}
                                        hasDSC={director.hasDSC}
                                        requestDINfromPeko={director.requestDINfromPeko}
                                        requestDSCfromPeko={director.requestDSCfromPeko ?? false}
                                        onDINChange={v =>
                                            setFieldValue(
                                                `directors.${index}.requestDINfromPeko`,
                                                v
                                            )
                                        }
                                        onDSCToggle={v => {
                                            setFieldValue(`directors.${index}.hasDSC`, v);
                                            if (v) setFieldValue(`directors.${index}.requestDSCfromPeko`, false);
                                        }}
                                        onDSCCheckboxChange={v =>
                                            setFieldValue(`directors.${index}.requestDSCfromPeko`, v)
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <WarningBox
                items={[
                    'All directors must have a Digital Signature Certificate (DSC)',
                    // 'All directors must have or apply for a Director Identification Number (DIN)',
                    'Foreign directors require additional documentation and review',
                ]}
            />
        </div>
    );
};

export default Directors;
