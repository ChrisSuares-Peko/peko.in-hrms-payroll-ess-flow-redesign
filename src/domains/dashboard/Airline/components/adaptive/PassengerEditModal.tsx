import { useState } from 'react';

import { Col, Flex, Form, Radio, Row } from 'antd';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useGetCountries from '../../hooks/useGetCountries';
import { IFareRulesData } from '../../types/fareRules';

interface PassengerModalProps {
    open: boolean;
    handleCancel: () => void;
    handleSubmit: (val: {}) => void;
    passengerType: string;
    initialValue: any | null;
    fareRules: IFareRulesData[];
}

const PassengerEditModal = ({
    open,
    handleCancel,
    handleSubmit,
    passengerType,
    initialValue,
    fareRules,
}: PassengerModalProps) => {
    const { countryData, phoneCodes } = useGetCountries();
    const isPassportRequired =
        fareRules[0]?.bookingRules?.passengerRules[0]?.isDocumentNumberMandatory;
    const travellerEditData = Yup.object().shape({
        firstName: Yup.string()
            .min(3, 'First name must be at least 3 characters')
            .required('Please enter the first name')
            .test(
                'no-leading-whitespace',
                'First name cannot start with whitespace',
                value => !/^\s/.test(value)
            )
            .test(
                'no-multiple-whitespace',
                'First name cannot contain consecutive whitespaces',
                value => !/\s{2,}/.test(value)
            )
            .test(
                'not-only-whitespace',
                'First name cannot be only whitespace',
                value => !/^\s*$/.test(value)
            ),
        lastName: Yup.string()
            .min(2, 'Last name must have at least 2 characters')
            .required('Please enter the last name')
            .test(
                'no-leading-whitespace',
                'Last name cannot start with whitespace',
                value => !/^\s/.test(value)
            )
            .test(
                'no-multiple-whitespace',
                'Last name cannot contain consecutive whitespaces',
                value => !/\s{2,}/.test(value)
            )
            .test(
                'not-only-whitespace',
                'Last name cannot be only whitespace',
                value => !/^\s*$/.test(value)
            ),
        gender: Yup.string().trim().required('Please select gender'),
        passportNo: Yup.string().when('isPassportRequired', {
            is: (value: string) =>
                !!fareRules[0]?.bookingRules?.passengerRules[0]?.isDocumentNumberMandatory,
            then: schema => schema.required('Please enter passport no'),
            otherwise: schema => schema,
        }),
        passengerType: Yup.string().trim(),
        isPassportRequired: Yup.boolean(),
        issuedCountry: Yup.string().when('isPassportRequired', {
            is: (value: string) =>
                !!fareRules[0]?.bookingRules?.passengerRules[0]?.isDocumentNumberMandatory,
            then: schema => schema.required('Please enter Issued country'),
            otherwise: schema => schema,
        }),
        dob: Yup.date().required('Please enter the date of birth'),

        expiryDate: Yup.string().when('isPassportRequired', {
            is: (value: string) =>
                !!fareRules[0]?.bookingRules?.passengerRules[0]?.isDocumentNumberMandatory,
            then: schema => schema.required('Please enter expiry date'),
            otherwise: schema => schema,
        }),
    });

    const [defaultValue, setDefaultValue] = useState('M');
    return (
        <CustomModalWithForm
            modalTitle={`Edit ${initialValue?.passengerType}`}
            open={open}
            handleCancel={handleCancel}
            validationSchema={travellerEditData}
            initialValues={{
                gender: initialValue?.gender,
                firstName: initialValue?.firstName,
                lastName: initialValue?.lastName,
                dob: initialValue?.dob,
                passportNo: initialValue?.passportNo,
                issuedCountry: initialValue?.issuedCountry,
                expiryDate: initialValue?.expiryDate,
                passengerType: initialValue?.passengerType,
                phoneCode: '',
                phone: initialValue?.phone,
                email: initialValue?.email,
            }}
            handleFormSubmit={val => {
                handleSubmit(val);
            }}
            reinitialise
        >
            <Flex vertical className="mt-6 w-full">
                <Form layout="vertical">
                    <Radio.Group
                        className="mb-4"
                        onChange={e => setDefaultValue(e.target.value)}
                        value={defaultValue}
                    >
                        <Radio value="M">Male</Radio>
                        <Radio value="F">Female</Radio>
                    </Radio.Group>
                    <TextInput
                        name="firstName"
                        label="First Name"
                        type="text"
                        placeholder="Enter First Name"
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="lastName"
                        label="Last Name"
                        type="text"
                        placeholder="Enter Last Name"
                        classes=" rounded-sm"
                    />
                    <DatePickerInput
                        name="dob"
                        label="Date Of Birth"
                        placeholder="Select Date Of Birth"
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="passportNo"
                        label="Passport No"
                        type="text"
                        placeholder="Enter Passport No"
                        classes=" rounded-sm"
                        isRequired={isPassportRequired}
                    />
                    <SelectInput
                        name="issuedCountry"
                        placeholder="Select Country"
                        options={countryData ?? []}
                        isRequired={isPassportRequired}
                    />
                    <DatePickerInput
                        name="expiryDate"
                        label="Passport expiry"
                        placeholder="Enter Passport Expiry"
                        classes=" rounded-sm"
                        isRequired={isPassportRequired}
                    />
                    <Row className="mt-2 w-full">
                        <Col span={8}>
                            <SelectInput
                                name="phoneCode"
                                placeholder="select country"
                                options={phoneCodes ?? []}
                                isRequired
                                label="Mobile Number"
                            />
                        </Col>
                        <Col span={16}>
                            <TextInput
                                type="text"
                                placeholder="Enter mobile number"
                                name="phone"
                                allowNumbersOnly
                                maxLength={10}
                                classes="w-full mt-7"
                                isRequired
                            />
                        </Col>
                    </Row>
                    <TextInput
                        type="text"
                        placeholder="Enter email address"
                        name="email"
                        classes="w-full"
                        label="Email Id"
                        isRequired
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default PassengerEditModal;
