import { Col, Form, Row, Select, Typography } from 'antd';

import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { HsnCodeResult } from '../../apis';
import { GstApplicationValues } from '../../types';

const { Text } = Typography;

// GST_Registration.pdf §E4 — Nature of Business Activity (14 fixed options, confirmed exact
// wording — do not substitute the generic public GST REG-01 list, it differs).
const NATURE_OF_BUSINESS_ACTIVITY_OPTIONS = [
    'Bonded Warehouse',
    'EOU / STP / EHTP',
    'Factory / Manufacturing',
    'Import',
    'Leasing Business',
    'Office / Sale Office',
    'Warehouse / Depot',
    'Export',
    'Supplier of Services',
    'Recipient of Goods or Services',
    'Retail Business',
    'Wholesale Business',
    'Works Contract',
    'Others',
].map(option => ({ label: option, value: option }));

const RULE_14A_OPTIONS = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
];

const MAX_HSN_SELECTIONS = 5;

interface GstInformationStepProps {
    values: GstApplicationValues;
    hsnSearchResults: HsnCodeResult[];
    isSearchingHsn: boolean;
    onHsnSearch: (searchTerm: string) => void;
    hsnSelectedCodes: string[];
    onHsnSelectionChange: (codes: string[]) => void;
}

// Step 3: Nature of Business Activity (+ conditional "Others" free text), Option For Registration
// Under Rule 14A, and Top 5 - Goods & Services. HSN search is confirmed and wired up; SAC search
// isn't confirmed by IndiaFilings yet (GST_REGISTRATION_PDF_SPEC.md §E5) — its field renders but
// stays disabled until that endpoint is confirmed, so this isn't silently missing functionality.
const GstInformationStep = ({
    values,
    hsnSearchResults,
    isSearchingHsn,
    onHsnSearch,
    hsnSelectedCodes,
    onHsnSelectionChange,
}: GstInformationStepProps) => {
    const hsnSelectOptions = [
        // Already-selected codes must stay in the option list even if the current search text no
        // longer matches them, or antd would drop their labels from the selected tags.
        ...values.hsnItems
            .filter(item => !hsnSearchResults.some(result => result.code === item.code))
            .map(item => ({ value: item.code, label: `HSN - ${item.code} - ${item.description}` })),
        ...hsnSearchResults.map(result => ({ value: result.code, label: result.display })),
    ];

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <Row gutter={[16, 8]}>
                <Col xs={24}>
                    <MultiSelectInput
                        name="natureOfBusinessActivity"
                        label="Nature Of Business Activity"
                        placeholder="Select one or more"
                        isRequired
                        options={NATURE_OF_BUSINESS_ACTIVITY_OPTIONS}
                    />
                </Col>
                {values.natureOfBusinessActivity.includes('Others') && (
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="othersActivity"
                            label="Please specify"
                            type="text"
                            classes="h-10"
                            isRequired
                            placeholder="Describe the other business activity"
                        />
                    </Col>
                )}
                <Col xs={24} sm={12}>
                    <RadioGroupInput
                        name="registrationUnderRule14A"
                        label="Option For Registration Under Rule 14A"
                        isRequired
                        options={RULE_14A_OPTIONS}
                    />
                    <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                        You may avail option under Rule 14A if the ITC to be passed on is less than
                        or equal to 2.5 lakhs per month, otherwise please click on No. Further, to
                        avail said option Aadhaar Authentication is mandatory.
                    </Text>
                </Col>
                <Col xs={24} sm={12}>
                    <Text className="text-sm" style={{ color: '#595959' }}>
                        Top 5 — Goods (HSN) <span style={{ color: '#FF3A3A' }}>*</span>
                    </Text>
                    <Select
                        mode="multiple"
                        allowClear
                        showSearch
                        filterOption={false}
                        placeholder="Search and select up to 5 HSN codes"
                        style={{ width: '100%', height: 40 }}
                        loading={isSearchingHsn}
                        value={hsnSelectedCodes}
                        options={hsnSelectOptions}
                        onSearch={onHsnSearch}
                        onChange={onHsnSelectionChange}
                        maxTagCount="responsive"
                        notFoundContent={isSearchingHsn ? 'Searching…' : 'Type to search HSN codes'}
                    />
                    <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                        {hsnSelectedCodes.length}/{MAX_HSN_SELECTIONS} selected
                    </Text>
                </Col>
                <Col xs={24} sm={12}>
                    <Text className="text-sm" style={{ color: '#595959' }}>
                        Top 5 — Services (SAC)
                    </Text>
                    <Select
                        mode="multiple"
                        disabled
                        style={{ width: '100%', height: 40 }}
                        placeholder="SAC search is not yet available"
                    />
                    <Text className="text-sm" style={{ color: '#8C8C8C' }}>
                        Services (SAC) selection is pending confirmation from IndiaFilings — you can
                        still submit using HSN codes for now.
                    </Text>
                </Col>
            </Row>
        </Form>
    );
};

export default GstInformationStep;
