import { useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import useGetCountry from '@src/domains/dashboard/Payroll/hooks/employeeHooks/useGetCountry';
import { stateOptions } from '@src/domains/dashboard/Payroll/utils/employeeDetails/utils';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { EmployeeProfile } from '../../api/onboarding';
import { useProfileUpdateRequest } from '../../hooks/useProfileUpdateRequest';

const { Text } = Typography;

interface ProfileUpdateFormValues {
    mobileNumber: string;
    personalEmail: string;
    workEmail: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    country: string;
    pinCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
}

const validationSchema = Yup.object({
    mobileNumber: Yup.string()
        .matches(/^\d{10}$/, 'Please enter a valid 10-digit mobile number')
        .required('Please enter your mobile number'),
    personalEmail: Yup.string().email('Please enter a valid email address').optional(),
    workEmail: Yup.string().optional(),
    addressLine1: Yup.string().required('Please enter your address'),
    addressLine2: Yup.string().optional(),
    state: Yup.string().optional(),
    country: Yup.string().optional(),
    pinCode: Yup.string().optional(),
    emergencyContactName: Yup.string().required('Please enter your emergency contact name'),
    emergencyContactPhone: Yup.string()
        .matches(/^\d{10}$/, 'Please enter a valid 10-digit phone number')
        .test(
            'not-all-same',
            'Phone number is invalid',
            value => !value || !/^(\d)\1+$/.test(value)
        )
        .required('Please enter your emergency contact phone'),
});

interface RequestProfileUpdateModalProps {
    open: boolean;
    onClose: () => void;
    profile?: EmployeeProfile | null;
    onSuccess?: () => void;
}

const RequestProfileUpdateModal = ({
    open,
    onClose,
    profile,
    onSuccess,
}: RequestProfileUpdateModalProps) => {
    const dispatch = useAppDispatch();
    const { submitProfileUpdate } = useProfileUpdateRequest();
    const { countriesList } = useGetCountry();
    const personal = profile?.personalInformation;
    const [selectedCountry, setSelectedCountry] = useState(personal?.country ?? '');

    const initialValues: ProfileUpdateFormValues = {
        mobileNumber: personal?.mobileNo ?? '',
        personalEmail: personal?.email ?? '',
        workEmail: profile?.employeeInformation?.workEmailId ?? '',
        addressLine1: personal?.addressLine1 ?? '',
        addressLine2: personal?.addressLine2 ?? '',
        state: personal?.state ?? '',
        country: personal?.country ?? '',
        pinCode: personal?.pinCode ?? '',
        emergencyContactName: personal?.emergencyContactName ?? '',
        emergencyContactPhone: personal?.emergencyContactNo ?? '',
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={null}
            centered
            width={870}
            destroyOnClose
            styles={{ content: { borderRadius: 24, padding: 32, overflow: 'hidden' } }}
        >
            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                    const isSubmitted = await submitProfileUpdate({
                        mobileNumber: values.mobileNumber,
                        addressLine1: values.addressLine1,
                        addressLine2: values.addressLine2 || '',
                        state: values.state || '',
                        country: values.country || '',
                        pinCode: values.pinCode || '',
                        emergencyContactName: values.emergencyContactName,
                        emergencyContactPhone: values.emergencyContactPhone,
                    });
                    setSubmitting(false);
                    if (isSubmitted) {
                        dispatch(
                            showToast({
                                description: 'Profile update request submitted successfully.',
                                variant: 'success',
                            })
                        );
                        resetForm();
                        onClose();
                        onSuccess?.();
                    }
                }}
            >
                {({ handleSubmit, isSubmitting, dirty }) => (
                    <Form
                        onFinish={handleSubmit}
                        layout="vertical"
                        className="[&_.ant-form-item]:!mb-2"
                    >
                        <div className="mb-6">
                            <Text className="text-[26px] font-semibold text-black">
                                Request Profile Update
                            </Text>
                        </div>

                        <Flex
                            align="center"
                            gap={8}
                            className="px-3.5 py-2.5 mb-6 border rounded-lg"
                            style={{
                                background: '#fffaed',
                                borderColor: '#f7d699',
                            }}
                        >
                            <InfoCircleOutlined style={{ color: '#a87817' }} className="text-xs" />
                            <Text style={{ color: '#a87817' }} className="text-xs">
                                All changes require HR approval before taking effect.
                            </Text>
                        </Flex>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <TextInput
                                name="mobileNumber"
                                label="Mobile Number"
                                type="text"
                                isRequired
                                allowNumbersOnly
                                maxLength={10}
                            />
                            <TextInput
                                name="personalEmail"
                                label="Personal Email"
                                type="email"
                                isRequired
                                isDisabled
                            />
                            <TextInput
                                name="workEmail"
                                label="Work Email"
                                type="email"
                                isRequired
                                isDisabled
                            />
                            <TextInput
                                name="emergencyContactName"
                                label="Emergency Contact Name"
                                type="text"
                                isRequired
                            />
                            <TextInput
                                name="emergencyContactPhone"
                                label="Emergency Contact Phone"
                                type="text"
                                isRequired
                                allowNumbersOnly
                                maxLength={10}
                            />
                            <TextInput
                                name="pinCode"
                                label="Pin Code"
                                type="text"
                                allowNumbersOnly
                                maxLength={6}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-1">
                            <TextInput
                                name="addressLine1"
                                label="Address Line 1"
                                type="text"
                                isRequired
                            />
                            <TextInput name="addressLine2" label="Address Line 2" type="text" />
                            <SelectInputWithSearch
                                name="country"
                                label="Country"
                                placeholder="Select Country"
                                options={countriesList ?? []}
                                handleChange={setSelectedCountry}
                            />
                            {selectedCountry === 'India' && (
                                <SelectInputWithSearch
                                    name="state"
                                    label="State"
                                    placeholder="Select State"
                                    options={stateOptions}
                                />
                            )}
                        </div>

                        <Flex gap={12} className="mt-6">
                            <Button
                                className="flex-1 h-16 rounded-xl font-medium"
                                style={{
                                    borderColor: '#CBD5E1',
                                    paddingBlock: 18,
                                    paddingInline: 24,
                                }}
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                                disabled={!dirty}
                                className="flex-1 h-16 rounded-xl font-medium"
                                style={{ paddingBlock: 18, paddingInline: 24 }}
                            >
                                Submit Request
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default RequestProfileUpdateModal;
