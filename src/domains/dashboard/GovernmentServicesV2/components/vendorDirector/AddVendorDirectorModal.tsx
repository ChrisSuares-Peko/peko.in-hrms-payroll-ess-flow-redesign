import { Button, Col, Form, Modal, Row } from 'antd';
import dayjs from 'dayjs';
import { Form as FormikForm, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { VendorDirector } from '../../apis';
import { OCCUPATION_OPTIONS, QUALIFICATION_OPTIONS, SALUTATION_OPTIONS } from '../../utils/vendorDirector';

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const passportRegex = /^[A-Z]{1}[0-9]{7}$/;

interface AddDirectorFormValues {
    panOrPassport: string;
    relationship: string;
    firstName: string;
    lastName: string;
    salutation: string;
    dob: string;
    qualification: string;
    occupation: string;
    email: string;
    mobile: string;
}

const EMPTY_DIRECTOR_FORM: AddDirectorFormValues = {
    panOrPassport: '',
    relationship: '',
    firstName: '',
    lastName: '',
    salutation: '',
    dob: '',
    qualification: '',
    occupation: '',
    email: '',
    mobile: '',
};

const directorSchema = Yup.object().shape({
    panOrPassport: Yup.string()
        .required('Please enter PAN or Passport number')
        .test('pan-or-passport', 'Enter a valid PAN (e.g. ABCDE1234F) or Passport number (e.g. A1234567)', (value) => {
            if (!value) return false;
            const upper = value.trim().toUpperCase();
            return panRegex.test(upper) || passportRegex.test(upper);
        }),
    relationship: Yup.string().required('Please select the promoter type'),
    lastName: Yup.string().required('Please enter the last name'),
    salutation: Yup.string().required('Please select a salutation'),
    dob: Yup.string()
        .required('Please select the date of birth')
        .test('min-age', 'Person must be at least 18 years old', (value) =>
            value ? dayjs().diff(dayjs(value, 'DD-MM-YYYY'), 'year') >= 18 : false
        ),
    qualification: Yup.string().required('Please select the qualification'),
    occupation: Yup.string().required('Please select the occupation'),
    email: Yup.string().required('Please enter the email address').email('Please enter a valid email address'),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'),
});

const AddDirectorFields = ({ relationshipOptions }: { relationshipOptions: { label: string; value: string }[] }) => {
    const { values } = useFormikContext<AddDirectorFormValues>();
    const fullName = [values.salutation, values.firstName, values.lastName].filter(Boolean).join(' ');

    return (
        <Form layout="vertical" className="[&_.ant-form-item]:!mb-3">
            <FormikForm className="flex flex-col gap-3">
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <TextInput name="panOrPassport" label="PAN / Passport" type="text" isRequired placeholder="Enter PAN or Passport" />
                    </Col>
                    <Col xs={24} sm={12}>
                        <SelectInput name="relationship" label="Promoter Type" placeholder="Please Select" isRequired options={relationshipOptions} />
                    </Col>
                </Row>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <TextInput name="firstName" label="First Name" type="text" placeholder="Enter first name" />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput name="lastName" label="Last Name" type="text" isRequired placeholder="Enter last name" />
                    </Col>
                </Row>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <SelectInput name="salutation" label="Salutation" placeholder="Select" isRequired options={SALUTATION_OPTIONS} />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput
                            name="fullName"
                            label="Full Name"
                            type="text"
                            isRequired
                            isDisabled
                            values={fullName}
                            placeholder="Auto-filled from Salutation, First & Last Name"
                        />
                    </Col>
                </Row>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <DatePickerInput name="dob" label="Date of Birth" placeholder="Select date of birth" isRequired maxDate={dayjs().subtract(18, 'years')} format="DD-MM-YYYY" disabledDate={(current) => current && current > dayjs().subtract(18, 'years').endOf('day')} />
                    </Col>
                    <Col xs={24} sm={12}>
                        <SelectInput name="qualification" label="Qualification" placeholder="Please Select" isRequired options={QUALIFICATION_OPTIONS} />
                    </Col>
                </Row>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <SelectInput name="occupation" label="Occupation" placeholder="Please Select" isRequired options={OCCUPATION_OPTIONS} />
                    </Col>
                    <Col xs={24} sm={12}>
                        <TextInput name="email" label="Email" type="email" isRequired placeholder="Enter email address" />
                    </Col>
                </Row>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12}>
                        <TextInput name="mobile" label="Mobile Number" type="text" isRequired placeholder="Enter 10-digit mobile number" />
                    </Col>
                </Row>
            </FormikForm>
        </Form>
    );
};

interface AddVendorDirectorModalProps {
    isOpen: boolean;
    isSaving: boolean;
    relationshipOptions: { label: string; value: string }[];
    onCancel: () => void;
    onSave: (director: VendorDirector) => void;
}

const AddVendorDirectorModal = ({ isOpen, isSaving, relationshipOptions, onCancel, onSave }: AddVendorDirectorModalProps) => {
    const handleSubmit = (formValues: AddDirectorFormValues) => {
        const panOrPassport = formValues.panOrPassport.trim().toUpperCase();
        const isPan = panRegex.test(panOrPassport);
        onSave({
            salutation: formValues.salutation,
            first_name: formValues.firstName,
            last_name: formValues.lastName,
            dob: dayjs(formValues.dob, 'DD-MM-YYYY').format('YYYY-MM-DD'),
            qualification: formValues.qualification,
            occupation: formValues.occupation,
            relationship: formValues.relationship,
            email: formValues.email,
            mobile: formValues.mobile,
            isd_code: '91',
            ...(isPan ? { pan: panOrPassport } : { passport_number: formValues.panOrPassport.trim() }),
        });
    };

    return (
        <Modal title="Add Management Information" open={isOpen} onCancel={onCancel} footer={null} destroyOnClose width={640}>
            <Formik<AddDirectorFormValues> initialValues={EMPTY_DIRECTOR_FORM} validationSchema={directorSchema} onSubmit={handleSubmit}>
                {({ submitForm }) => (
                    <>
                        <AddDirectorFields relationshipOptions={relationshipOptions} />
                        <div className="flex justify-between gap-3 mt-2">
                            <Button onClick={onCancel}>Cancel</Button>
                            <Button type="primary" loading={isSaving} onClick={submitForm}>
                                Add
                            </Button>
                        </div>
                    </>
                )}
            </Formik>
        </Modal>
    );
};

export default AddVendorDirectorModal;
