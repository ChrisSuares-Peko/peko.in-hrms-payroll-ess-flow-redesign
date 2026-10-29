import { useState } from 'react';

import { Form, Modal, Select } from 'antd';
import { useFormik, FormikProvider } from 'formik';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addNewCustomer } from '../../api/customers';
import { CURRENCY_OPTIONS } from '../../constants/createInvoice';
import { withSpaceValidation } from '../../utils/yupHelpers';

interface AddCustomerModalProps {
    open: boolean;
    onClose: () => void;
    stateOptions: DropDown;
    onSuccess: (customer: {
        name: string;
        email: string;
        phoneNumber: string;
        gstin: string;
        primaryAddress: string;
        primaryCity: string;
        primaryState: string;
        primaryCountry: string;
        primaryPincode: string;
        currency: string;
    }) => void;
}

const schema = Yup.object({
    name: withSpaceValidation(
        Yup.string().required('Please enter the Customer Name'),
        'Customer Name'
    ),
    email: withSpaceValidation(Yup.string(), 'Email').email('Invalid email'),
    phoneNumber: withSpaceValidation(
        Yup.string().required('Please enter the Mobile Number'),
        'Mobile Number'
    ).matches(/^[6-9][0-9]{9}$/, 'Please enter a valid Indian mobile number'),
    gstin: Yup.string()
        .optional()
        .test('valid-gstin', 'GSTIN must be 15 characters', v => {
            if (!v) return true;
            if (v.length !== 15) return false;
            return true;
        })
        .test('valid-gstin-format', 'Invalid GSTIN format', v => {
            if (!v || v.length !== 15) return true;
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
        }),
    primaryAddress: withSpaceValidation(
        Yup.string().required('Please enter the Address'),
        'Address'
    ),
    primaryCity: withSpaceValidation(Yup.string().required('Please enter the City'), 'City'),
    primaryState: Yup.string().required('Please select the State'),
    primaryPincode: Yup.string()
        .required('Please enter the Pincode')
        .matches(/^[0-9]{6}$/, 'PIN code must be exactly 6 digits'),
    currency: Yup.string().required('Please select the currency'),
});

const INITIAL_VALUES = {
    name: '',
    email: '',
    phoneNumber: '',
    gstin: '',
    primaryAddress: '',
    primaryCity: '',
    primaryState: '',
    primaryPincode: '',
    currency: 'INR',
};

const AddCustomerModal = ({ open, onClose, stateOptions, onSuccess }: AddCustomerModalProps) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(s => (s as any).reducer.auth);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formik = useFormik({
        initialValues: INITIAL_VALUES,
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async values => {
            setIsSubmitting(true);
            const result = await addNewCustomer({
                userId: id,
                userType: role,
                name: values.name,
                email: values.email,
                phoneNumber: values.phoneNumber,
                gstin: values.gstin,
                primaryAddress: values.primaryAddress,
                primaryCity: values.primaryCity,
                primaryState: values.primaryState,
                primaryPincode: values.primaryPincode,
                primaryCountry: 'India',
                currency: values.currency,
                bankAccounts: [],
            });
            if (result) {
                dispatch(
                    showToast({ description: 'Customer added successfully', variant: 'success' })
                );
                onSuccess({ ...values, primaryCountry: 'India' });
                handleClose();
            }
            setIsSubmitting(false);
        },
    });

    const handleClose = () => {
        formik.resetForm({ values: INITIAL_VALUES });
        onClose();
    };

    return (
        <FormikProvider value={formik}>
            <Modal
                title="Add Customer"
                open={open}
                onCancel={handleClose}
                onOk={() => formik.handleSubmit()}
                okText="Save & Select"
                okButtonProps={{ danger: true, loading: isSubmitting }}
                cancelButtonProps={{ disabled: isSubmitting }}
                width={540}
                destroyOnHidden
            >
                <Form layout="vertical" component="div" className="space-y-3 pt-2">
                    <TextInput
                        name="name"
                        label="Customer/Business Name"
                        placeholder="Enter customer/business name"
                        type="text"
                        isRequired
                        maxLength={50}
                        allowAlphabetsAndSpaceOnly
                    />
                    <TextInput
                        name="email"
                        label="Email"
                        placeholder="Enter email address"
                        type="email"
                    />
                    <TextInput
                        name="phoneNumber"
                        label="Mobile Number"
                        placeholder="Enter mobile number"
                        type="text"
                        isRequired
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <TextInput
                        name="gstin"
                        label="GSTIN"
                        placeholder="Enter GSTIN (optional)"
                        type="text"
                        convertToUppercase
                        maxLength={15}
                        allowAlphabetsAndNumbersOnly
                    />
                    <TextInput
                        name="primaryAddress"
                        label="Address"
                        placeholder="Enter address"
                        type="text"
                        isRequired
                        maxLength={100}
                        allowAddressFormat
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <TextInput
                            name="primaryCity"
                            label="City"
                            placeholder="Enter city"
                            type="text"
                            isRequired
                            maxLength={50}
                            allowAlphabetsOnly
                        />
                        <TextInput
                            name="primaryPincode"
                            label="Pincode"
                            isRequired
                            placeholder="Enter pincode"
                            type="text"
                            allowNumbersOnly
                            maxLength={6}
                        />
                    </div>
                    <Form.Item
                        label="State"
                        required
                        colon={false}
                        validateStatus={
                            formik.touched.primaryState && formik.errors.primaryState ? 'error' : ''
                        }
                        help={formik.touched.primaryState ? formik.errors.primaryState : ''}
                    >
                        <Select
                            value={formik.values.primaryState || undefined}
                            placeholder="Select state"
                            options={stateOptions}
                            showSearch
                            filterOption={(input, option) =>
                                String(option?.label ?? '')
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }
                            onChange={val => formik.setFieldValue('primaryState', val)}
                            onBlur={() => formik.setFieldTouched('primaryState', true)}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <SelectInputWithSearch
                        name="currency"
                        label="Currency"
                        placeholder="Select currency"
                        options={CURRENCY_OPTIONS}
                        isRequired
                    />
                </Form>
            </Modal>
        </FormikProvider>
    );
};

export default AddCustomerModal;
