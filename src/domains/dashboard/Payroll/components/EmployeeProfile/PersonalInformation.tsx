import { useState } from 'react';

import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, FormikHelpers } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import SelectInput from './SelectInput';
import useGeneralApi from '../../hooks/employeeHooks/useGetCountry';
import { useValidateEmployeeApi } from '../../hooks/employeeHooks/useGetValidateEmployeeInfoApi';
import { employeePersonalSchema } from '../../schema/employeeProfile';
import { setPersonalInformation } from '../../slices/employeeSettings';
import { stateOptions } from '../../utils/employeeDetails/utils';

type Props = {
    nextTab: (key: string) => void;
};

const PersonalInformation = ({ nextTab }: Props) => {
    const dispatch = useAppDispatch();
    const { validateEmployee, isLoading } = useValidateEmployeeApi();
    const { countriesList } = useGeneralApi();

    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const { personalInformation } = useAppSelector(state => state.reducer.employeeSettings);
    const genderOptions = [
        { key: 1, value: 'MALE', label: 'Male' },
        { key: 2, value: 'FEMALE', label: 'Female' },
    ];

    const handleCountryChange = (value: string) => {
        setSelectedCountry(value);
    };
    const handlePersonalInformation = async (values: any, actions: FormikHelpers<any>) => {
        const validationPayload = {
            email: values.email,
            mobileNo: values.mobileNo,
        };

        const result = await validateEmployee(validationPayload);

        if (result?.data?.status) {
            dispatch(setPersonalInformation(values));
            nextTab('2');
        }
    };
    const initialValues = {
        fullName: personalInformation?.fullName || '',
        dateOfBirth: personalInformation?.dateOfBirth || '',
        gender: personalInformation?.gender || '',
        mobileNo: personalInformation?.mobileNo || '',
        email: personalInformation?.email || '',
        emergencyContactNo: personalInformation?.emergencyContactNo || '',
        emergencyContactName: personalInformation?.emergencyContactName || '',
        emergencyContactRelation: personalInformation?.emergencyContactRelation || '',
        country: personalInformation?.country || undefined,
        state: personalInformation?.state || '',
        addressLine1: personalInformation?.addressLine1 || '',
        addressLine2: personalInformation?.addressLine2 || '',
        pinCode: personalInformation?.pinCode || '',
        isDiffrentlyAbled: personalInformation?.isDiffrentlyAbled || false,
        // Passport Number field disabled on this tab.
        // passportNo: '',
        // passportIssuedCountry: undefined,
        // passportIssuedDate: '',
        // passportExpiryDate: '',
    };
    return (
        <Flex vertical className=" my-8">
            <Formik
                initialValues={initialValues}
                validationSchema={employeePersonalSchema}
                onSubmit={handlePersonalInformation}
            >
                {({ handleSubmit, setFieldValue, validateField, values }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="">
                        <Flex justify="center">
                            <Col span={16}>
                                <Row>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Full Name"
                                            isRequired
                                            name="fullName"
                                            placeholder="Enter Full Name"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            maxLength={50}
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <SelectInput
                                            isRequired
                                            label="Gender"
                                            name="gender"
                                            placeholder="Select Gender"
                                            classes=" rounded-sm "
                                            options={genderOptions}
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <DatePickerInput
                                            label="Date Of Birth"
                                            isRequired
                                            name="dateOfBirth"
                                            placeholder="Select Date"
                                            classes=" rounded-sm w-full"
                                            needConfirm={false}
                                            maxDate={dayjs().subtract(18, 'year')}
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Mobile Number"
                                            name="mobileNo"
                                            allowNumbersOnly
                                            maxLength={10}
                                            minLength={9}
                                            placeholder="Enter Mobile Number"
                                            type="text"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Personal Email ID"
                                            name="email"
                                            type="text"
                                            placeholder="Enter Personal Email ID"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <SelectInputWithSearch
                                            label="Country"
                                            name="country"
                                            options={countriesList ?? []}
                                            placeholder="Select Country"
                                            classes="rounded-sm"
                                            handleChange={handleCountryChange}
                                            isRequired
                                        />
                                    </Col>
                                    {selectedCountry === 'India' && (
                                        <Col xs={24} sm={10} className="mx-auto">
                                            <SelectInputWithSearch
                                                label="State"
                                                name="state"
                                                placeholder="Select State"
                                                classes="rounded-sm"
                                                options={stateOptions}
                                                isRequired
                                            />
                                        </Col>
                                    )}
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Address Line 1"
                                            name="addressLine1"
                                            type="text"
                                            placeholder="Enter Address Line 1"
                                            maxLength={100}
                                            allowAlphabetsNumberAndSpecialCharacters={[
                                                ' ',
                                                '.',
                                                ',',
                                                '/',
                                                ')',
                                                '(',
                                                '@',
                                                '-',
                                                '_',
                                            ]}
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Address Line 2"
                                            name="addressLine2"
                                            type="text"
                                            placeholder="Enter Address Line 2"
                                            maxLength={100}
                                            allowAlphabetsNumberAndSpecialCharacters={[
                                                ' ',
                                                '.',
                                                ',',
                                                '/',
                                                ')',
                                                '(',
                                                '@',
                                                '-',
                                                '_',
                                            ]}
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="PIN Code"
                                            name="pinCode"
                                            type="text"
                                            placeholder="Enter PIN Code"
                                            maxLength={6}
                                            allowNumbersOnly
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Emergency Contact Number"
                                            name="emergencyContactNo"
                                            type="text"
                                            placeholder="Enter Emergency Contact Number"
                                            maxLength={10}
                                            allowNumbersOnly
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Emergency Contact Name"
                                            name="emergencyContactName"
                                            type="text"
                                            placeholder="Enter Emergency Contact Name"
                                            allowAlphabetsAndSpaceOnly
                                            maxLength={20}
                                        />
                                    </Col>
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Emergency Contact Relation"
                                            name="emergencyContactRelation"
                                            type="text"
                                            placeholder="Enter Emergency Contact Relation"
                                            allowAlphabetsAndSpaceOnly
                                            maxLength={20}
                                        />
                                    </Col>
                                    {/* Passport Number field disabled on this tab — see task history.
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <TextInput
                                            label="Passport Number"
                                            name="passportNo"
                                            placeholder="Passport Number"
                                            type="text"
                                            maxLength={10}
                                        />
                                    </Col>
                                    {values.passportNo && (
                                        <>
                                            <Col xs={24} sm={10} className="mx-auto">
                                                <SelectInputWithSearch
                                                    label="Passport Issuing Country"
                                                    name="passportIssuedCountry"
                                                    options={countriesList ?? []}
                                                    placeholder="Select Issuing Country"
                                                    isRequired
                                                    handleChange={val => {
                                                        setFieldValue(
                                                            'passportIssuedCountry',
                                                            val !== undefined ? val : ''
                                                        );
                                                        setTimeout(() => {
                                                            validateField('passportIssuedCountry');
                                                        }, 0);
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={24} sm={10} className="mx-auto">
                                                <DatePickerInput
                                                    label="Passport Issued Date"
                                                    name="passportIssuedDate"
                                                    placeholder="Select Issuing Date"
                                                    classes="w-full"
                                                    maxDate={dayjs()}
                                                    isRequired
                                                />
                                            </Col>
                                            <Col xs={24} sm={10} className="mx-auto">
                                                <DatePickerInput
                                                    label="Passport Expiry Date"
                                                    name="passportExpiryDate"
                                                    placeholder="Select Expiry Date"
                                                    classes="w-full"
                                                    minDate={dayjs().add(1, 'day')}
                                                    isRequired
                                                />
                                            </Col>
                                        </>
                                    )}
                                    */}
                                    <Col xs={24} sm={10} className="mx-auto">
                                        <CheckboxInput name="isDiffrentlyAbled">
                                            <Typography.Text className="font-medium">
                                                Is differently abled?
                                            </Typography.Text>
                                        </CheckboxInput>
                                    </Col>
                                    <Col xs={24} sm={10} className="hidden md:block mx-auto" />
                                </Row>
                                <Flex justify="end" className="mx-4">
                                    <Button
                                        loading={isLoading}
                                        htmlType="submit"
                                        type="primary"
                                        danger
                                        className=" font-semibold w-[8rem] "
                                    >
                                        Next
                                    </Button>
                                </Flex>
                            </Col>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default PersonalInformation;
