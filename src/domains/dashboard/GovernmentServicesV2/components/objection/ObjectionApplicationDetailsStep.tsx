import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { Col, Form, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { OBJECTION_SECTION_OPTIONS, PROOF_AVAILABLE_OPTIONS, SALUTATION_OPTIONS } from '../../utils/objectionForm';

const { Text } = Typography;

interface ObjectionApplicationDetailsStepProps {
    isLookingUp: boolean;
    lookupError: string | null;
    isFetched: boolean;
    onApplicationNumberChange: (value: string) => void;
}

// Step 1 (doc §5 + §6): Application Number is the driver field — Brand/Class/Application Date/
// Applicant Name/Applicant Address are all fetched from it and stay disabled until a lookup
// resolves (see TrademarkObjectionForm.tsx / apis/objection.ts). Notice Date is the one exception
// — the vendor's application-lookup response has no notice-date concept at all (it's a trademark
// registry record, not an objection-notice one), so it's left as a normal editable field instead.
// All fields bind to Formik via their own `name` prop (see the shared atomic inputs), so this
// component doesn't need values/setFieldValue itself.
const ObjectionApplicationDetailsStep = ({
    isLookingUp,
    lookupError,
    isFetched,
    onApplicationNumberChange,
}: ObjectionApplicationDetailsStepProps) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={[16, 8]}>
            <Col xs={24}>
                <TextInput
                    name="applicationNumber"
                    label="Application Number"
                    type="text"
                    classes="h-10"
                    isRequired
                    placeholder="Enter the application number"
                    handleChange={onApplicationNumberChange}
                    suffix={isLookingUp ? <LoadingOutlined /> : <SearchOutlined style={{ color: '#bfbfbf' }} />}
                />
                {lookupError && (
                    <Text className="!text-[13px] !text-[#ff4d4f] !block !mt-1">{lookupError}</Text>
                )}
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
                <DatePickerInput
                    name="applicationDate"
                    label="Application Date"
                    placeholder="Fetched from the application number"
                    classes="h-10 w-full"
                    isRequired
                    isDisabled
                    format="DD-MM-YYYY"
                />
            </Col>
            <Col xs={24} sm={12}>
                {/* Not returned by the vendor lookup (see the comment above) — entered manually,
                    but still gated on a successful lookup first like Objection Section/Proof Available. */}
                <DatePickerInput
                    name="noticeDate"
                    label="Notice Date"
                    placeholder="Select the notice date"
                    classes="h-10 w-full"
                    isRequired
                    isDisabled={!isFetched}
                    maxDate={dayjs()}
                    format="DD-MM-YYYY"
                />
            </Col>

            <Col xs={24}>
                <MultiSelectInput
                    name="objectionSections"
                    label="Objection Section"
                    placeholder="Select one or more objection sections"
                    classes="h-10"
                    isRequired
                    isDisabled={!isFetched}
                    options={OBJECTION_SECTION_OPTIONS}
                />
            </Col>
            <Col xs={24}>
                <MultiSelectInput
                    name="proofAvailable"
                    label="Proof Available"
                    placeholder="Select the proof available (optional)"
                    classes="h-10"
                    isDisabled={!isFetched}
                    options={PROOF_AVAILABLE_OPTIONS}
                />
            </Col>

            <Col xs={24}>
                <TextInput
                    name="applicantName"
                    label="Applicant Name"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled
                    placeholder="Fetched from the application number"
                />
            </Col>

            <Col xs={24} sm={12}>
                <SelectInput
                    name="salutation"
                    label="Salutation"
                    placeholder="Select"
                    classes="h-10"
                    isRequired
                    isDisabled={!isFetched}
                    options={SALUTATION_OPTIONS}
                />
            </Col>
            <Col xs={24} sm={12}>
                {/* Free text for now, not a select — there's no real "people mapped against the
                    business" list to choose from yet (doc §5's People API isn't wired), and a
                    select with no options just behaves like a dead text field anyway. Swap this
                    back to SelectInput once that API exists. */}
                <TextInput
                    name="authorizedPerson"
                    label="Authorized Person"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled={!isFetched}
                    placeholder="Enter the authorized person"
                />
            </Col>

            <Col xs={24}>
                <TextInput
                    name="applicantAddress"
                    label="Applicant Address"
                    type="text"
                    classes="h-10"
                    isRequired
                    isDisabled
                    placeholder="Fetched from the application number"
                />
            </Col>
        </Row>
    </Form>
);

export default ObjectionApplicationDetailsStep;
