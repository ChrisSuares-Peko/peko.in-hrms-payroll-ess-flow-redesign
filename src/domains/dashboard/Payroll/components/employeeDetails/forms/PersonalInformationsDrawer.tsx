import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useGeneralApi from '../../../hooks/employeeHooks/useGetCountry';
import { useUpdateEmployeeApiNew } from '../../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { editPersonalSchema } from '../../../schema/employeeProfile';
import { stateOptions } from '../../../utils/employeeDetails/utils';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    initialValues: {
        id: string;
        firstName: string;
        gender: string;
        dateOfBirth: string;
        phoneNumber: string;
        personalEmail: string;
        email: string;
        emergencyContactNo: string;
        emergencyContactName: string;
        emergencyContactRelation: string;
        country: string;
        pinCode: string;
        addressLine1: string;
        addressLine2: string;
        state?: string;
        passportNo?: string;
        passportIssuedCountry?: string;
        passportExpiryDate?: string;
        passportIssuedDate?: string;
    };
};

const PersonalInformationsDrawer = ({ handleCancel, open, initialValues, setRefState }: Props) => {
    const { countriesList } = useGeneralApi();
    const { updateEmployeePersonalDetails } = useUpdateEmployeeApiNew();

    return (
        <CustomModalWithForm
            modalTitle="Personal Information"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let payload = { ...values };
                if (!payload.passportNo) {
                    payload.passportIssuedCountry = '';
                    payload.passportIssuedDate = '';
                    payload.passportExpiryDate = '';
                }
                payload = {
                    id: initialValues.id,
                    employeeBasicInformation: {
                        personalInformation: payload,
                    },
                };

                const res = await updateEmployeePersonalDetails(payload);
                if (res) setRefState(new Date().valueOf());
                handleCancel();
            }}
            initialValues={{
                fullName: initialValues?.firstName ?? '',
                dateOfBirth: initialValues?.dateOfBirth ?? '',
                gender: initialValues?.gender ?? '',
                mobileNo: initialValues?.phoneNumber,
                personalEmail: initialValues?.personalEmail ?? '',
                email: initialValues?.email ?? '',
                emergencyContactNo: initialValues?.emergencyContactNo ?? '',
                emergencyContactName: initialValues?.emergencyContactName ?? '',
                emergencyContactRelation: initialValues?.emergencyContactRelation ?? '',
                country: initialValues?.country ?? '',
                pinCode: initialValues?.pinCode ?? '',
                addressLine1: initialValues?.addressLine1 ?? '',
                addressLine2: initialValues?.addressLine2 ?? '',
                state: initialValues?.state ?? '',
                passportNo: initialValues?.passportNo ?? '',
                passportIssuedCountry: initialValues?.passportIssuedCountry ?? '',
                passportExpiryDate: initialValues?.passportExpiryDate ?? '',
                passportIssuedDate: initialValues?.passportIssuedDate ?? '',
            }}
            validationSchema={editPersonalSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical" className="">
                    <TextInput
                        name="fullName"
                        label="Full Name"
                        type="text"
                        placeholder="Enter Full Name"
                        classes="rounded-sm text-black"
                        allowAlphabetsAndSpaceOnly
                        isRequired
                        maxLength={20}
                    />
                    <SelectInput
                        name="gender"
                        label="Gender"
                        placeholder="Select Gender"
                        classes="rounded-sm"
                        options={[
                            { value: 'MALE', label: 'Male' },
                            { value: 'FEMALE', label: 'Female' },
                        ]}
                        isRequired
                    />
                    <DatePickerInput
                        name="dateOfBirth"
                        label="Date Of Birth"
                        placeholder="Select Date Of Birth"
                        classes="rounded-sm w-full"
                        needConfirm={false}
                        maxDate={dayjs().subtract(18, 'year')}
                        isRequired
                    />
                    <TextInput
                        name="mobileNo"
                        label="Mobile Number"
                        type="text"
                        placeholder="Enter Mobile Number"
                        classes="rounded-sm"
                        allowNumbersOnly
                        isRequired
                        maxLength={10}
                    />
                    <TextInput
                        name="email"
                        label="Personal Email"
                        type="email"
                        placeholder="Enter personal email"
                        classes="rounded-sm"
                        isRequired
                    />
                    <SelectInputWithSearch
                        name="country"
                        label="Country"
                        placeholder="Select Country"
                        classes="rounded-sm"
                        options={countriesList ?? []}
                        isRequired
                    />
                    {values.country === 'India' && (
                        <SelectInputWithSearch
                            name="state"
                            label="State"
                            placeholder="Select State"
                            classes="rounded-sm"
                            options={stateOptions}
                            isRequired
                        />
                    )}
                    <TextInput
                        name="pinCode"
                        label="PIN Code"
                        type="text"
                        placeholder="Enter PIN Code"
                        classes="rounded-sm"
                        maxLength={6}
                        allowNumbersOnly
                    />
                    <TextInput
                        name="emergencyContactNo"
                        label="Emergency Contact Number"
                        type="text"
                        placeholder="Enter Emergency Contact Number"
                        classes="rounded-sm"
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <TextInput
                        name="emergencyContactName"
                        label="Emergency Contact Name"
                        type="text"
                        placeholder="Enter Emergency Contact Name"
                        classes="rounded-sm"
                        allowAlphabetsAndSpaceOnly
                        maxLength={20}
                    />
                    <TextInput
                        name="emergencyContactRelation"
                        label="Emergency Contact Relation"
                        type="text"
                        placeholder="Enter Emergency Contact Relation"
                        classes="rounded-sm"
                        allowAlphabetsAndSpaceOnly
                        maxLength={20}
                    />
                    <TextInput
                        name="addressLine1"
                        label="Address Line 1"
                        type="text"
                        placeholder="Enter Address Line 1"
                        classes="rounded-sm"
                        maxLength={50}
                        isRequired
                    />
                    <TextInput
                        name="addressLine2"
                        label="Address Line 2"
                        type="text"
                        placeholder="Enter Address Line 2"
                        classes="rounded-sm"
                        maxLength={20}
                    />
                    <TextInput
                        name="passportNo"
                        label="Passport Number"
                        type="text"
                        placeholder="Enter Passport Number"
                        maxLength={10}
                    />
                    {values.passportNo && (
                        <>
                            <SelectInputWithSearch
                                isRequired
                                name="passportIssuedCountry"
                                label="Passport Issuing Country"
                                placeholder="Select Issuing Country"
                                options={countriesList ?? []}
                                handleChange={val => {
                                    setFieldValue('passportIssuedCountry', val ?? '');
                                }}
                            />
                            <DatePickerInput
                                isRequired
                                name="passportIssuedDate"
                                label="Passport Issued Date"
                                placeholder="Select Issued Date"
                                classes="w-full"
                                needConfirm={false}
                                maxDate={dayjs()}
                            />
                            <DatePickerInput
                                isRequired
                                name="passportExpiryDate"
                                label="Passport Expiry Date"
                                placeholder="Select Expiry Date"
                                classes="w-full"
                                needConfirm={false}
                                minDate={dayjs().add(1, 'day')}
                            />
                        </>
                    )}
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default PersonalInformationsDrawer;
