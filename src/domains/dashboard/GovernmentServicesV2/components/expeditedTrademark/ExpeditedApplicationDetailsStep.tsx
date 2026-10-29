import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { Col, Form, Row, Typography } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { SALUTATION_OPTIONS } from '../../utils/expeditedTrademarkForm';

const { Text } = Typography;

interface ExpeditedApplicationDetailsStepProps {
    isLookingUp: boolean;
    lookupError: string | null;
    businessOptions: { label: string; value: string }[];
    isLoadingBusinesses: boolean;
    isAuthorizedPersonLocked: boolean;
    hasSelectedApplicant: boolean;
    onApplicationNumberChange: (value: string) => void;
    onSelectBusiness: (applicationId: string) => void;
}

// Doc §1-2: Application Number is the driver field for Brand/Class (fetched, disabled). Applicant
// Name is picked from the vendor's own Business List (same substitute for the doc's "parent
// workspace" business picker Protection's own step already uses) rather than typed; Entity Type is
// derived from that same selection and shown read-only. Authorized Person has no confirmed
// "people mapped to this business" API (doc's own person-picker widget) — plain text field, locked
// and auto-filled to the business name for Individual/Proprietorship (doc §2's "no separate
// authorized person" rule), gated behind an applicant being selected first ("Please select a
// business name to proceed.") otherwise.
const ExpeditedApplicationDetailsStep = ({
    isLookingUp,
    lookupError,
    businessOptions,
    isLoadingBusinesses,
    isAuthorizedPersonLocked,
    hasSelectedApplicant,
    onApplicationNumberChange,
    onSelectBusiness,
}: ExpeditedApplicationDetailsStepProps) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
                <TextInput
                    name="applicationNumber"
                    label="Application Number"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the application number"
                    handleChange={onApplicationNumberChange}
                    suffix={
                        isLookingUp ? (
                            <LoadingOutlined />
                        ) : (
                            <SearchOutlined style={{ color: '#bfbfbf' }} />
                        )
                    }
                />
                {lookupError && (
                    <Text className="!text-[13px] !text-[#ff4d4f] !block !mt-1">{lookupError}</Text>
                )}
            </Col>
            <Col xs={24} sm={12}>
                <DatePickerInput
                    name="applicationDate"
                    label="Application Date"
                    placeholder="Select the application date"
                    classes="h-10 w-full"
                    isRequired
                    format="DD-MM-YYYY"
                />
            </Col>

            <Col xs={24} sm={12}>
                <TextInput
                    name="trademarkClass"
                    label="Class"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled
                    placeholder="Fetched from the application number"
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="brand"
                    label="Brand"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled
                    placeholder="Fetched from the application number"
                />
            </Col>

            <Col xs={24} sm={12}>
                <SelectInput
                    name="applicantBusinessId"
                    label="Applicant Name"
                    placeholder={
                        isLoadingBusinesses ? 'Loading businesses…' : 'Select the business'
                    }
                    classes="h-10"
                    isRequired
                    isDisabled={isLoadingBusinesses}
                    options={businessOptions}
                    showSearch
                    handleChange={onSelectBusiness}
                />
            </Col>
            <Col xs={24} sm={12}>
                <TextInput
                    name="entityType"
                    label="Entity Type"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled
                    placeholder="Filled from the selected business"
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
                    isDisabled={isAuthorizedPersonLocked || !hasSelectedApplicant}
                    placeholder={
                        hasSelectedApplicant
                            ? 'Enter the authorized person'
                            : 'Please select a business name to proceed'
                    }
                />
            </Col>

            <Col xs={24}>
                <TextInput
                    name="applicantAddress"
                    label="Applicant Address"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the applicant address"
                />
            </Col>

            <Col xs={24}>
                <TextAreaInput
                    name="declarationReason"
                    label="Declaration of Reason for Expedited Examination"
                    isRequired
                    minRows={3}
                    placeholder="Enter the reason for requesting expedited examination"
                />
            </Col>
        </Row>
    </Form>
);

export default ExpeditedApplicationDetailsStep;
