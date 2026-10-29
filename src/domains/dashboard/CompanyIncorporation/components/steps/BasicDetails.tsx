import { Radio, Row, Col } from 'antd';
import { useFormikContext } from 'formik';

import indianFlag from '@assets/flagIndia.png';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { ApplicationPayload, EntityType } from '../../types';
import { ENTITY_TYPES, INDIA_STATES, stateFilterOption } from '../../utils/data';

const OFFICE_TYPE_OPTIONS = [
    { label: 'Rented', value: 'rented' },
    { label: 'Owned', value: 'owned' },
    { label: 'Shared Office', value: 'shared_office' },
];

const MobilePrefix = () => (
    <div className="flex items-center gap-[6px] whitespace-nowrap min-w-max cursor-default">
        <img src={indianFlag} alt="India" className="w-5 h-auto flex-shrink-0" />
        <span className="text-textCharcoal font-semibold text-[13px] flex-shrink-0">+91</span>
    </div>
);

const BasicDetails = () => {
    const { values, errors, touched, setFieldValue } = useFormikContext<ApplicationPayload>();

    return (
        <div className="flex flex-col gap-5">
            {/* Applicant Details */}
            <div className="border border-zinc-200 rounded-[22px] p-6">
                <p className="text-[18px] font-medium text-black mb-6">Applicant Details</p>
                <div className="flex flex-col gap-4">
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <TextInput
                                label="Full Name"
                                name="applicantDetails.fullName"
                                type="text"
                                placeholder="Enter full name"
                                isRequired
                                size="large"
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput
                                label="Email Address"
                                name="applicantDetails.email"
                                type="text"
                                placeholder="Enter email address"
                                isRequired
                                size="large"
                            />
                        </Col>
                    </Row>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <TextInput
                                label="Mobile Number"
                                name="applicantDetails.mobile"
                                type="text"
                                placeholder="Mobile Number"
                                maxLength={10}
                                isRequired
                                allowNumbersOnly
                                size="large"
                                addonBefore={<MobilePrefix />}
                                formItemClass="static-phone-addon"
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <SelectInput
                                label="State"
                                name="applicantDetails.state"
                                options={INDIA_STATES}
                                placeholder="Select State"
                                isRequired
                                size="large"
                                showSearch
                                filterOption={stateFilterOption}
                            />
                        </Col>
                    </Row>
                </div>
            </div>

            {/* Entity Type */}
            <div className="border border-zinc-200 rounded-[22px] p-6">
                <p className="text-[18px] font-medium text-black/85 mb-6">
                    Entity Type<span className="text-errorTextRed ml-1">*</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ENTITY_TYPES.map(entity => {
                        const isSelected = values.entityType === entity.value;
                        return (
                            <div
                                key={entity.value}
                                role="button"
                                tabIndex={0}
                                className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-lightRed shadow-[0px_2px_20px_rgba(0,0,0,0.06)]'
                                        : 'border-borderGrayLight'
                                } bg-white`}
                                onClick={() => setFieldValue('entityType', entity.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setFieldValue('entityType', entity.value);
                                    }
                                }}
                            >
                                <Radio
                                    value={entity.value}
                                    checked={isSelected}
                                    onChange={() => setFieldValue('entityType', entity.value)}
                                />
                                <span className="text-[12px] sm:text-[15px] text-black leading-[18px] sm:leading-[22px]">
                                    {entity.label}
                                    {entity.value === 'private_limited' && (
                                        <span className="ml-1">(Most Common)</span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {errors.entityType && touched.entityType && (
                    <p data-form-error="true" className="text-lightRed text-[12px] mt-2">{errors.entityType}</p>
                )}

                {values.entityType === EntityType.LLP && (
                    <div className="mt-6">
                        <SelectInput
                            label="State of Registration"
                            name="registeredOffice.state"
                            options={INDIA_STATES}
                            placeholder="Select state of registration"
                            isRequired
                            size="large"
                            showSearch
                            filterOption={stateFilterOption}
                        />
                    </div>
                )}
            </div>

            {/* Proposed Company Names */}
            <div className="border border-zinc-200 rounded-[22px] p-6">
                <div className="mb-6">
                    <p className="text-[18px] font-medium text-black/85">
                        Proposed Company Names
                    </p>
                    <p className="text-[14px] text-slate-500 mt-1 leading-[20px]">
                        Provide 2 names in order of preference. Avoid names similar to existing
                        companies.
                    </p>
                </div>
                <div className="flex flex-col gap-4">
                    <TextInput
                        label="First Choice"
                        name="proposedNames.firstChoice"
                        type="text"
                        placeholder="e.g. Company Name"
                        isRequired
                        size="large"
                    />
                    <TextInput
                        label="Second Choice"
                        name="proposedNames.secondChoice"
                        type="text"
                        placeholder="Alternative name"
                        size="large"
                    />
                </div>
            </div>

            {/* Registered Office Availability */}
            <div className="border border-zinc-200 rounded-[22px] p-6">
                <p className="text-[18px] font-medium text-black/85 mb-6">
                    Registered Office Availability<span className="text-errorTextRed ml-1">*</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {[
                        { value: 'have', label: 'Yes, I have a registered office' },
                        { value: 'need', label: 'No, I need help arrange this' },
                    ].map(opt => {
                        const isSelected = values.registeredOffice?.availability === opt.value;
                        const handleAvailabilityChange = (val: string) => {
                            setFieldValue('registeredOffice.availability', val);
                            if (val === 'need') {
                                setFieldValue('registeredOffice.officeType', '');
                                setFieldValue('registeredOffice.address', '');
                                setFieldValue('registeredOffice.hasUtilityBill', false);
                            }
                        };
                        return (
                            <div
                                key={opt.value}
                                role="button"
                                tabIndex={0}
                                className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition-all sm:flex-1 ${
                                    isSelected
                                        ? 'border-lightRed shadow-[0px_1.2px_12px_rgba(0,0,0,0.06)]'
                                        : 'border-borderGrayLight'
                                } bg-white`}
                                onClick={() => handleAvailabilityChange(opt.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleAvailabilityChange(opt.value);
                                    }
                                }}
                            >
                                <Radio
                                    value={opt.value}
                                    checked={isSelected}
                                    onChange={() => handleAvailabilityChange(opt.value)}
                                />
                                <span className="text-[11px] sm:text-[18px] text-black leading-[18px] sm:leading-[28px]">
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {values.registeredOffice?.availability === 'have' && (
                    <div className="border border-borderPink rounded-[16px] p-6 flex flex-col gap-6">
                        <Row gutter={[24, 0]}>
                            <Col xs={24} md={12}>
                                <SelectInput
                                    label="Office Type"
                                    name="registeredOffice.officeType"
                                    options={OFFICE_TYPE_OPTIONS}
                                    placeholder="Select Office type"
                                    isRequired
                                    size="large"
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <TextInput
                                    label="Full Address"
                                    name="registeredOffice.address"
                                    type="text"
                                    placeholder="Enter full address"
                                    isRequired
                                    size="large"
                                    allowAddressFormat
                                    maxLength={200}
                                />
                            </Col>
                        </Row>
                    </div>
                )}

                {values.registeredOffice?.availability === 'need' && (
                    <div className="bg-slate-50 rounded-[14px] p-4 flex items-start gap-4">
                        <div className="flex-shrink-0 mt-[2px]">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 14.6522 3.05357 17.1957 4.92893 19.0711C5.85752 19.9997 6.95991 20.7362 8.17317 21.2388C9.38642 21.7413 10.6868 22 12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2ZM12.5 17H11.5V11H12.5V17ZM12.5 9H11.5V7H12.5V9Z"
                                    className="fill-slate-500"
                                />
                            </svg>
                        </div>
                        <p className="text-[16px] text-slate-600 leading-[24px] flex-1">
                            Peko can help you arrange a registered office address. Our
                            representative will get in touch with you after the application is
                            submitted.
                        </p>
                    </div>
                )}
            </div>

            {/* ID & Address Proof Checkbox */}
            <CheckboxInput name="registeredOffice.hasIdProof">
                <span className="text-[18px] text-black">
                    I have ID & address proofs for all Directors / Subscribers
                </span>
            </CheckboxInput>
        </div>
    );
};

export default BasicDetails;
