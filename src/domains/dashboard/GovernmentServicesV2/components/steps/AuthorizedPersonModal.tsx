import { Button, Col, Form as AntForm, Modal, Row } from 'antd';
import { Form, Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { gstAuthorizedPersonSchema } from '../../schema';
import { GstAuthorizedPerson } from '../../types';
import {
    EMPTY_AUTHORIZED_PERSON,
    GST_RELATIONSHIP_OPTIONS,
    GST_SALUTATION_OPTIONS,
} from '../../utils/gstForm';

type AuthorizedPersonFormValues = Omit<GstAuthorizedPerson, 'key'>;

interface AuthorizedPersonModalProps {
    open: boolean;
    // null = "Add" mode (starts blank); a person's own field values = "Edit" mode.
    initialValues: AuthorizedPersonFormValues | null;
    onClose: () => void;
    onSubmit: (values: AuthorizedPersonFormValues) => void;
}

// Step 1's Authorized Persons list is add/edit-via-modal, preview-only in the step itself (per the
// confirmed design) — every person that reaches authorizedPersons[] has already passed
// gstAuthorizedPersonSchema here, so the array-level schema on Next can never find an incomplete
// entry hiding behind whichever person the dropdown currently has selected.
const AuthorizedPersonModal = ({
    open,
    initialValues,
    onClose,
    onSubmit,
}: AuthorizedPersonModalProps) => {
    const isEditMode = initialValues !== null;

    const handleSubmit = (values: AuthorizedPersonFormValues) => {
        onSubmit(values);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnClose
            width={560}
            title={isEditMode ? 'Edit Authorized Person' : 'Add Authorized Person'}
        >
            <Formik<AuthorizedPersonFormValues>
                initialValues={initialValues ?? EMPTY_AUTHORIZED_PERSON}
                validationSchema={gstAuthorizedPersonSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                <Form className="mt-4">
                    <AntForm layout="vertical" component={false}>
                        <Row gutter={[16, 8]}>
                            <Col xs={24} sm={8}>
                                <SelectInput
                                    name="salutation"
                                    label="Salutation"
                                    placeholder="Select"
                                    classes="h-10"
                                    isRequired
                                    options={GST_SALUTATION_OPTIONS}
                                />
                            </Col>
                            <Col xs={24} sm={16}>
                                <TextInput
                                    name="fullName"
                                    label="Full Name"
                                    type="text"
                                    classes="h-10"
                                    isRequired
                                    placeholder="Enter full name"
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="pan"
                                    label="PAN Number"
                                    type="text"
                                    classes="h-10"
                                    isRequired
                                    maxLength={10}
                                    convertToUppercase
                                    placeholder="e.g., ABCDE1234F"
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <DatePickerInput
                                    name="dob"
                                    label="Date of Birth"
                                    placeholder="Select date of birth"
                                    isRequired
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="mobile"
                                    label="Mobile Number"
                                    type="text"
                                    classes="h-10"
                                    isRequired
                                    allowNumbersOnly
                                    maxLength={10}
                                    placeholder="e.g., 9876543210"
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <TextInput
                                    name="email"
                                    label="Email"
                                    type="text"
                                    classes="h-10"
                                    isRequired
                                    placeholder="e.g., joseph@example.com"
                                />
                            </Col>
                            <Col xs={24}>
                                <SelectInput
                                    name="relationship"
                                    label="Relationship"
                                    placeholder="e.g., Director, Partner, Proprietor"
                                    classes="h-10"
                                    isRequired
                                    options={GST_RELATIONSHIP_OPTIONS}
                                />
                            </Col>
                        </Row>
                    </AntForm>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button onClick={onClose} className="!h-10 !px-5">
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" className="!h-10 !px-5">
                            {isEditMode ? 'Save' : 'Add Person'}
                        </Button>
                    </div>
                </Form>
            </Formik>
        </Modal>
    );
};

export default AuthorizedPersonModal;
