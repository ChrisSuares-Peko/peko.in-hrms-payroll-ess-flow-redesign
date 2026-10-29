import { Col, Form, Row, Spin } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { VendorBusiness } from '../../apis';

// Same fixed list ServiceDetail.tsx uses for Create Business's entity_type — kept in sync with it.
const ENTITY_TYPE_OPTIONS = [
    'Private Limited Company',
    'Limited Liability Partnership',
    'One Person Company',
    'Partnership',
    'Proprietorship',
    'Section 8 Company',
    'Public Limited Company',
    'Nidhi Company',
    'Producer Company',
    'Trust',
    'Indian Subsidiary',
].map((entity) => ({ label: entity, value: entity }));

// Workflow doc's salutation set — includes "M/s.", unlike BusinessRegistration's.
const SALUTATION_OPTIONS = [
    { label: 'Mr.', value: 'Mr.' },
    { label: 'Mrs.', value: 'Mrs.' },
    { label: 'Ms.', value: 'Ms.' },
    { label: 'M/s.', value: 'M/s.' },
];

interface ApplicantDetailsStepProps {
    businessOptions: { label: string; value: string }[];
    businesses: VendorBusiness[];
    onSelectBusiness: (business: VendorBusiness | undefined) => void;
    isLookingUpPincode: boolean;
    onPincodeChange: (value: string) => void;
}

// Step 1: Trademark Owner (resolved from the vendor Business List) + Applicant Details.
const ApplicantDetailsStep = ({
    businessOptions,
    businesses,
    onSelectBusiness,
    isLookingUpPincode,
    onPincodeChange,
}: ApplicantDetailsStepProps) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="trademarkOwner"
                    label="Trademark Owner"
                    placeholder="Select the business"
                    classes="h-10"
                    isRequired
                    options={businessOptions}
                    showSearch
                    handleChange={(value) => {
                        const business = businesses.find((b) => String(b.application_id) === value);
                        onSelectBusiness(business);
                    }}
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="entityType"
                    label="Entity Type"
                    placeholder="Select the entity type"
                    classes="h-10"
                    isRequired
                    options={ENTITY_TYPE_OPTIONS}
                    showSearch
                />
            </Col>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="salutation"
                    label="Salutation"
                    placeholder="Select"
                    classes="h-10"
                    isRequired
                    options={SALUTATION_OPTIONS}
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="authorizedPerson"
                    label="Authorized Person"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the authorized person"
                />
            </Col>
            <Col xs={24}>
                <TextInput
                    name="address"
                    label="Address"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the address"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <TextInput
                    name="pincode"
                    label="PIN code"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the PIN code"
                    handleChange={onPincodeChange}
                    suffix={isLookingUpPincode ? <Spin size="small" /> : undefined}
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <TextInput
                    name="state"
                    label="State"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the state"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <TextInput
                    name="district"
                    label="District"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the district"
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <TextInput
                    name="country"
                    label="Country"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the country"
                />
            </Col>
        </Row>
    </Form>
);

export default ApplicantDetailsStep;
