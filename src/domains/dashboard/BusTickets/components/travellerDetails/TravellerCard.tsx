import { MutableRefObject, useState } from 'react';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Checkbox, Col, Flex, Form, Row, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useGetEmployee } from '@src/domains/dashboard/Airline/hooks/useGetEmployeeApi';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { accessKeys } from '@utils/accessKeys';

import usePhoneCodesApi from '../../hooks/usePhoneCodesApi';
import { travellerSchema } from '../../schema';
import { TravellerFormValues } from '../../slices/busTicketSlice';

type Props = {
    seatNumber: string;
    passengerNumber: number;
    formRef?: MutableRefObject<any>;
    savedValues?: TravellerFormValues;
    onUseSameContact?: (phone: string, email: string) => void;
};

const ID_TYPE_OPTIONS = ['Aadhaar', 'PAN Card', 'Passport', 'Driving License', 'Voter ID'].map(t => ({ label: t, value: t }));

const ID_LENGTH: Record<string, { min: number; max: number }> = {
    'Aadhaar':          { min: 12, max: 12 },
    'PAN Card':         { min: 10, max: 10 },
    'Passport':         { min: 8,  max: 8  },
    'Voter ID':         { min: 10, max: 10 },
    'Driving License':  { min: 15, max: 15 },
};

const EMPTY_VALUES: TravellerFormValues = {
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'male',
    countryCode: '+91',
    phone: '',
    email: '',
    idType: '',
    idNumber: '',
    address: '',
    employee: '',
};

export default function TravellerCard({ seatNumber, passengerNumber, formRef, savedValues, onUseSameContact }: Props) {
    const { phoneCodes } = usePhoneCodesApi();
    const { data: employeeList, generateEmployeesDropdown } = useGetEmployee();
    const isPurchased = useServiceAccess(accessKeys.payroll);
    const [collapsed, setCollapsed] = useState(false);
    const [empPassportNo, setEmpPassportNo] = useState('');
    const [sameContact, setSameContact] = useState(false);

    return (
        <Flex vertical style={{ border: '1px solid #D9D9D9', borderRadius: 10, overflow: 'hidden' }}>
            <Formik
                initialValues={savedValues ?? EMPTY_VALUES}
                enableReinitialize
                innerRef={formRef}
                validationSchema={travellerSchema}
                onSubmit={() => {}}
            >
                {({ handleSubmit, values, setFieldValue, setTouched }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">

                        {/* Header */}
                        <Flex
                            justify="space-between"
                            align="center"
                            role="button"
                            tabIndex={0}
                            style={{
                                borderBottom: 'none',
                                padding: '15px 20px',
                                cursor: 'pointer',
                            }}
                            onClick={() => setCollapsed(c => !c)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCollapsed(c => !c); }}
                        >
                            <Flex vertical gap={12}>
                                <Typography.Text style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
                                    Adult Passenger {passengerNumber}
                                </Typography.Text>
                                {!collapsed && (
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                                        Seat Number {seatNumber}
                                    </Typography.Text>
                                )}
                            </Flex>
                            {collapsed ? <DownOutlined /> : <UpOutlined />}
                        </Flex>

                        {/* Employee dropdown — always visible when payroll employees exist */}
                        {employeeList.length > 0 && (
                            <div style={{ padding: '4px 20px 0', marginBottom: -8 }}>
                                <SelectInputWithSearch
                                    name="employee"
                                    placeholder="Select employee"
                                    options={generateEmployeesDropdown(employeeList)}
                                    isRequired={false}
                                    isDisabled={!isPurchased}
                                    disableDeselect={false}
                                    handleChange={async eid => {
                                        if (!eid) {
                                            await Promise.all([
                                                setFieldValue('firstName', ''),
                                                setFieldValue('lastName', ''),
                                                setFieldValue('dob', ''),
                                                setFieldValue('gender', 'male'),
                                                setFieldValue('phone', ''),
                                                setFieldValue('email', ''),
                                                setFieldValue('address', ''),
                                                setFieldValue('idNumber', ''),
                                            ]);
                                            setTouched({});
                                            setEmpPassportNo('');
                                            return;
                                        }
                                        const emp = generateEmployeesDropdown(employeeList).find(e => e.value === eid);
                                        if (!emp) return;
                                        const [firstName, ...rest] = emp.fullName.split(' ');
                                        await Promise.all([
                                            setFieldValue('firstName', firstName || ''),
                                            setFieldValue('lastName', rest.join(' ') || ''),
                                            setFieldValue('dob', emp.dateOfBirth || ''),
                                            setFieldValue('gender', emp.gender === 'MALE' ? 'male' : 'female'),
                                            setFieldValue('phone', emp.mobileNo || ''),
                                            setFieldValue('email', emp.email || ''),
                                            setFieldValue('address', [emp.addressLine1, emp.addressLine2].filter(Boolean).join(' ')),
                                            ...(values.idType === 'Passport' && emp.passportNo
                                                ? [setFieldValue('idNumber', emp.passportNo)]
                                                : []),
                                        ]);
                                        setTouched({});
                                        setEmpPassportNo(emp.passportNo || '');
                                        if (collapsed) setCollapsed(false);
                                    }}
                                />
                            </div>
                        )}

                        {/* Collapsible form */}
                        {!collapsed && (
                            <div style={{ padding: '4px 20px 16px' }}>
                                <Row>
                                    <Col className="mr-10" sm={10}>
                                        <TextInput
                                            name="firstName"
                                            label="First Name"
                                            placeholder="Enter first name"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            minLength={3}
                                            maxLength={50}
                                            isRequired
                                        />
                                    </Col>
                                    <Col className="mr-10" sm={10}>
                                        <TextInput
                                            name="lastName"
                                            label="Last Name"
                                            placeholder="Enter last name"
                                            type="text"
                                            allowAlphabetsAndSpaceOnly
                                            minLength={3}
                                            maxLength={50}
                                            isRequired
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col className="mr-10" sm={10}>
                                        <DatePickerInput
                                            name="dob"
                                            label="Date of Birth"
                                            placeholder="Select date of birth"
                                            isRequired
                                            needConfirm={false}
                                            maxDate={dayjs().subtract(3, 'year')}
                                            classes="w-full"
                                        />
                                    </Col>
                                    <Col className="mr-10" sm={10}>
                                        <RadioGroupInput
                                            name="gender"
                                            label="Gender"
                                            isRequired
                                            simple
                                            options={[
                                                { label: 'Male', value: 'male' },
                                                { label: 'Female', value: 'female' },
                                            ]}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col className="mr-10" sm={10}>
                                        <Flex className="mb-2">
                                            <Typography.Text>
                                                <Typography.Text className="text-red-500 me-1">*</Typography.Text>
                                                Phone Number
                                            </Typography.Text>
                                        </Flex>
                                        <Row gutter={8}>
                                            <Col xs={10}>
                                                <Select
                                                    showSearch
                                                    value={values.countryCode}
                                                    onChange={val => setFieldValue('countryCode', val)}
                                                    className="w-full"
                                                    options={phoneCodes}
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </Col>
                                            <Col xs={14}>
                                                <TextInput
                                                    name="phone"
                                                    type="text"
                                                    placeholder="Enter phone number"
                                                    allowNumbersOnly
                                                    maxLength={10}
                                                    isRequired
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col className="mr-10" sm={10}>
                                        <TextInput
                                            name="email"
                                            label="Email ID"
                                            placeholder="Enter email ID"
                                            type="text"
                                            allowEmailsOnly
                                            minLength={3}
                                            maxLength={50}
                                            isRequired
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col className="mr-10" sm={10}>
                                        <SelectInput
                                            name="idType"
                                            label="ID Type"
                                            placeholder="Select ID type"
                                            options={ID_TYPE_OPTIONS}
                                            isRequired
                                            handleChange={val => {
                                                if (val === 'Passport' && empPassportNo) {
                                                    setFieldValue('idNumber', empPassportNo);
                                                }
                                            }}
                                        />
                                    </Col>
                                    <Col className="mr-10" sm={10}>
                                        <TextInput
                                            name="idNumber"
                                            label="ID Number"
                                            placeholder="Enter ID number"
                                            type="text"
                                            minLength={ID_LENGTH[values.idType]?.min ?? 3}
                                            maxLength={ID_LENGTH[values.idType]?.max ?? 50}
                                            convertToUppercase
                                            isRequired
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-2">
                                    <Col span={24}>
                                        <TextAreaInput
                                            name="address"
                                            label="Address"
                                            placeholder="Enter address"

                                            minLength={3}
                                            maxLength={150}
                                            minRows={3}
                                            showCount
                                           allowedCharacters="a-zA-Z0-9 ./,-"
                                        />
                                    </Col>
                                </Row>

                                {onUseSameContact && (
                                    <Flex style={{ marginTop: 16 }}>
                                        <Checkbox
                                            checked={sameContact}
                                            disabled={!values.phone || !values.email}
                                            onChange={e => {
                                                setSameContact(e.target.checked);
                                                if (e.target.checked) {
                                                    onUseSameContact(values.phone, values.email);
                                                } else {
                                                    onUseSameContact('', '');
                                                }
                                            }}
                                        >
                                            <Typography.Text style={{ fontSize: 13 }}>
                                                Use the same contact information for sending booking details
                                            </Typography.Text>
                                        </Checkbox>
                                    </Flex>
                                )}
                            </div>
                        )}
                    </Form>
                )}
            </Formik>
        </Flex>
    );
}
