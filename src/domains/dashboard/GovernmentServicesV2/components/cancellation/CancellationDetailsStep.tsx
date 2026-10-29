import { Col, Form, Row } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import { CANCELLATION_SALUTATION_OPTIONS } from '../../utils/gstCancellationForm';
import VendorDirectorSelect from '../vendorDirector/VendorDirectorSelect';

interface CancellationDetailsStepProps {
    directorOptions: { label: string; value: string }[];
    isLoadingDirectors: boolean;
    onSelectDirector: (directorId: string) => void;
    onAddDirector: () => void;
}

// Step 1 (GST_Registration_Cancellation_Work_Flow.docx §A1/§B) — exactly the 3 fields the docx's
// screenshot shows. Which business/GSTIN this cancels is decided earlier, on the pre-payment
// ServiceProfileForm's Select Business dropdown (GST_Cancellation_Implementation_Plan.md §5.3) —
// it isn't re-shown here since the docx's own Step 1 screenshot has no business picker, only the
// read-only Business Name in the Review summary.
//
// Authorized Person uses the common vendor-director picker (VendorDirectorSelect +
// AddVendorDirectorModal, wired up in GstCancellationForm.tsx/useCancellationApplicationData.ts) —
// same component every other GovernmentServicesV2 form will share, not a GST-Cancellation-specific
// one.
const CancellationDetailsStep = ({
    directorOptions,
    isLoadingDirectors,
    onSelectDirector,
    onAddDirector,
}: CancellationDetailsStepProps) => (
    <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
        <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
                <SelectInput
                    name="salutation"
                    label="Salutation"
                    placeholder="Select"
                    classes="h-10"
                    isRequired
                    options={CANCELLATION_SALUTATION_OPTIONS}
                />
            </Col>
            <Col xs={24} sm={12}>
                <VendorDirectorSelect
                    name="selectedDirectorId"
                    label="Authorized Person"
                    placeholder={isLoadingDirectors ? 'Loading…' : 'Select the authorized person'}
                    isDisabled={isLoadingDirectors}
                    options={directorOptions}
                    onSelectDirector={onSelectDirector}
                    onAddDirector={onAddDirector}
                />
            </Col>
            <Col xs={24}>
                <TextAreaInput
                    name="reasonForCancellation"
                    label="Reason for Cancellation"
                    placeholder="Describe the reason for cancelling this GST registration"
                    isRequired
                    minRows={4}
                />
            </Col>
        </Row>
    </Form>
);

export default CancellationDetailsStep;
