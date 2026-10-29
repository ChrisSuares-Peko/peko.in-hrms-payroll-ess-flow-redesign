import React from 'react';

import { Flex, Form, Select } from 'antd';
import { useFormikContext } from 'formik';
import { ReactSVG } from 'react-svg';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import DocumentUploadInput from '@src/domains/admin/hooks/DownloadUploadInput';
import TermsIcon from '@src/domains/dashboard/legalService/assets/icons/book-1.svg';
import CommercialIcon from '@src/domains/dashboard/legalService/assets/icons/commerial.svg';
import PrivacyIcon from '@src/domains/dashboard/legalService/assets/icons/document-1.svg';
import EmploymentIcon from '@src/domains/dashboard/legalService/assets/icons/employe_contract.svg';
import FreelanceIcon from '@src/domains/dashboard/legalService/assets/icons/employees-departments.svg';
import FoundersIcon from '@src/domains/dashboard/legalService/assets/icons/founder-agreement.svg';
import IPIcon from '@src/domains/dashboard/legalService/assets/icons/ip.svg';
import LoanIcon from '@src/domains/dashboard/legalService/assets/icons/money_bag.svg';
import NDAIcon from '@src/domains/dashboard/legalService/assets/icons/non-disclosure.svg';
import SaaSIcon from '@src/domains/dashboard/legalService/assets/icons/saas-subscription.svg';
import ShareholderIcon from '@src/domains/dashboard/legalService/assets/icons/share_holder.svg';
import VendorIcon from '@src/domains/dashboard/legalService/assets/icons/vendor.svg';

import { LegalTemplatesFormValues } from '../../types/legalTemplates';
import { ICON_KEY_OPTIONS, TEMPLATE_CATEGORIES } from '../../utils/legalTemplates';

const ICON_SVG_MAP: Record<string, string> = {
    nda: NDAIcon,
    employment: EmploymentIcon,
    privacy: PrivacyIcon,
    founders: FoundersIcon,
    freelance: FreelanceIcon,
    terms: TermsIcon,
    ip: IPIcon,
    shareholder: ShareholderIcon,
    vendor: VendorIcon,
    loan: LoanIcon,
    saas: SaaSIcon,
    commercial: CommercialIcon,
};

const LegalTemplatesForm: React.FC = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<LegalTemplatesFormValues>();

    return (
        <Flex vertical className="w-full">
            <Form layout="vertical">
                <TextInput
                    name="title"
                    label="Template Title"
                    placeholder="e.g. Non-Disclosure Agreement"
                    isRequired
                    type="text"
                    maxLength={150}
                />
                <CustomSelectSearch
                    name="category"
                    label="Category"
                    placeholder="Select Category"
                    isRequired
                    options={TEMPLATE_CATEGORIES}
                />
                <InputTextArea
                    name="description"
                    label="Description"
                    placeholder="Short description shown on template card"
                    isRequired
                    maxLength={300}
                />
                <TextInput
                    name="timeEstimate"
                    label="Time Estimate"
                    placeholder="e.g. 5–8 min"
                    isRequired
                    type="text"
                    maxLength={20}
                />
                <Form.Item
                    label="Icon"
                    required
                    validateStatus={
                        (touched as any).iconKey && (errors as any).iconKey ? 'error' : ''
                    }
                    help={
                        (touched as any).iconKey && (errors as any).iconKey
                            ? (errors as any).iconKey
                            : undefined
                    }
                >
                    <Select
                        placeholder="Select Icon"
                        value={values.iconKey || undefined}
                        onChange={val => setFieldValue('iconKey', val)}
                        allowClear
                        onClear={() => setFieldValue('iconKey', '')}
                        optionLabelProp="label"
                    >
                        {ICON_KEY_OPTIONS.map(({ oName, oValue }) => (
                            <Select.Option
                                key={oValue}
                                value={oValue}
                                label={
                                    <Flex align="center" gap={8}>
                                        {ICON_SVG_MAP[oValue] && (
                                            <ReactSVG
                                                src={ICON_SVG_MAP[oValue]}
                                                beforeInjection={svg => {
                                                    svg.setAttribute('width', '16');
                                                    svg.setAttribute('height', '16');
                                                }}
                                            />
                                        )}
                                        {oName}
                                    </Flex>
                                }
                            >
                                <Flex align="center" gap={8}>
                                    {ICON_SVG_MAP[oValue] && (
                                        <ReactSVG
                                            src={ICON_SVG_MAP[oValue]}
                                            beforeInjection={svg => {
                                                svg.setAttribute('width', '20');
                                                svg.setAttribute('height', '20');
                                            }}
                                        />
                                    )}
                                    <span>{oName}</span>
                                </Flex>
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                <DocumentUploadInput
                    name="documentFile"
                    label="Upload Template (DOCX only)"
                    format="documentFormat"
                    accept=".docx"
                    isrequired={!values.id}
                    showFileName
                    maxFileSize={10240}
                    existingFileUrl={values.documentUrl || undefined}
                    setFile={(base64: string) => setFieldValue('documentFile', base64 || '')}
                />
            </Form>
        </Flex>
    );
};

export default LegalTemplatesForm;
