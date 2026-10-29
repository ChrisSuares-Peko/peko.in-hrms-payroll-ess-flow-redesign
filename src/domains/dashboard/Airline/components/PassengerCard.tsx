import React, { useState } from 'react';

import { Checkbox, Col, Card, Row, Typography, Radio, Flex, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { Formik, Form } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import TravellerSelector from '@components/molecular/traveller-selector/TravellerSelector';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { useSavedTravellers } from '@src/hooks/useSavedTravellers';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { fullTravellerKey, nameDobKey, optionToIdentifiable } from '@utils/travellerIdentity';

// import { travellerData } from '../schema/travellerData';
import { useGetEmployee } from '../hooks/useGetEmployeeApi';
import { passengerValidation } from '../schema/travellerData';
import { addPassengersData, setContactInfoPassenger } from '../slices/airlineSlice';
import { PhoneCode } from '../types/airlineTypes';
import { AllFareQuote } from '../types/fareRules';
import { Passenger } from '../types/slices';
import { getFairDetails, getPaxType } from '../utils/passengerDetails';
import {
    airlineValuesToSavedPayload,
    applyToAirlineForm,
    optionIdentityKey,
} from '../utils/savedTravellerAdapter';

import '../assets/style.css';

type Props = {
    cardTitle: string;
    formRef: React.MutableRefObject<any>;
    formDomRef: React.MutableRefObject<any>;
    passengerType: 'adult' | 'child' | 'infant';
    fareQuotes: AllFareQuote;
    // countryData: CountryCode[];
    phoneCodes: PhoneCode[];
    bookingData: Passenger[];
    updatePassengerValidity: (value: boolean) => void;
    setReceiverDetails: any;
};

type Fare = {
    BaseFare: number;
    Tax: number;
};

type FormValues = {
    passengerId: string;
    employee: string;
    Title: string;
    FirstName: string;
    LastName: string;
    PaxType: number;
    DateOfBirth: string;
    Gender: number;
    PassportNo: string;
    PassportExpiry: string;
    PassportIssueDate: string;
    AddressLine1: string;
    AddressLine2: string;
    City: string;
    CellCountryCode: string;
    ContactNo: string;
    Email: string;
    IsLeadPax: boolean;
    Fare: Fare | null;
    OutbountFare: Fare | null;
    InbountFare: Fare | null;
    MealDynamic: any;
    Baggage: any;
    SeatDynamic: any;
    Nationality: 'IN';
    CountryCode: 'IN';
    CountryName: 'India';
    PassportIssueCountryCode?: string;
    PAN: string;
};

const PassengerCard = ({
    cardTitle,
    formRef,
    formDomRef,
    passengerType,
    fareQuotes,
    // countryData,
    phoneCodes,
    bookingData,
    setReceiverDetails,
    updatePassengerValidity,
}: Props) => {
    const { Paragraph } = Typography;
    const dispatch = useAppDispatch();
    const [gender, setGender] = useState<number>(1);

    const { data: employeeList, generateEmployeesDropdown } = useGetEmployee();
    const {
        data: savedTravellers,
        limit: savedTravellersLimit,
        canSaveMore,
        generateSavedTravellersDropdown,
        saveTraveller,
        removeTraveller,
    } = useSavedTravellers(accessKeys.airline);
    const [isSavingTraveller, setIsSavingTraveller] = useState(false);
    const [selectedBaselineKey, setSelectedBaselineKey] = useState<string | null>(null);
    const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);

    const handleSaveTraveller = async (formValues: any) => {
        const payload = airlineValuesToSavedPayload(formValues);
        if (!payload) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Enter first and last name before saving.',
                })
            );
            return;
        }
        setIsSavingTraveller(true);
        const res = await saveTraveller(payload);
        setIsSavingTraveller(false);
        if (res.ok) {
            setSelectedBaselineKey(fullTravellerKey(payload));
            dispatch(showToast({ variant: 'success', description: 'Passenger saved for reuse' }));
        } else if (res.atLimit) {
            dispatch(
                showToast({
                    variant: 'warning',
                    description: res.message || 'You have reached the saved passenger limit.',
                })
            );
        }
    };

    const handleDeleteSaved = async (savedId: number) => {
        const ok = await removeTraveller(savedId);
        if (ok) {
            dispatch(showToast({ variant: 'success', description: 'Saved traveller removed' }));
        }
    };

    const clearAutofilledFields = (setFieldValue: (field: string, value: unknown) => void) => {
        setFieldValue('employee', '');
        setFieldValue('FirstName', '');
        setFieldValue('LastName', '');
        setFieldValue('DateOfBirth', '');
        setFieldValue('PassportNo', '');
        setFieldValue('PassportExpiry', '');
        setFieldValue('PassportIssueDate', '');
        setFieldValue('Email', '');
        setFieldValue('ContactNo', '');
        setFieldValue('AddressLine1', '');
        setFieldValue('AddressLine2', '');
        setFieldValue('City', '');
        setFieldValue('PAN', '');
        setSelectedBaselineKey(null);
        setSelectedSavedId(null);
    };

    // Offer "Save passenger" only when the entered person is new: not an employee (by name+DOB)
    // and not already saved (by full identity). Any edit changes the key, so it re-appears and
    // saves as a new traveller.
    const shouldShowSaveCheckbox = (formValues: any) => {
        const payload = airlineValuesToSavedPayload(formValues);
        if (!payload) return false;
        if (selectedBaselineKey && fullTravellerKey(payload) === selectedBaselineKey) {
            return false;
        }
        if ((savedTravellers || []).some(t => fullTravellerKey(t) === fullTravellerKey(payload))) {
            return false;
        }
        const empList = isPurchased ? generateEmployeesDropdown(employeeList) : [];
        if (empList.some(o => nameDobKey(optionToIdentifiable(o as any)) === nameDobKey(payload))) {
            return false;
        }
        return true;
    };
    const isPurchased = useServiceAccess(accessKeys.payroll);

    const { flightSegments } = useAppSelector(state => state.reducer.airline.formData);
    const { contactInfoPassenger } = useAppSelector(state => state.reducer.airline);

    const isPassportRequired =
        fareQuotes.combined.IsPassportRequiredAtBook ||
        fareQuotes.combined.IsPassportRequiredAtTicket ||
        fareQuotes.combined.IsPassportFullDetailRequiredAtBook;

    const idDObRequired = isPassportRequired || passengerType !== 'adult';
    const isPanRequired =
        fareQuotes.combined.IsPanRequiredAtBook || fareQuotes.combined.IsPanRequiredAtTicket;
    const { IsPassportFullDetailRequiredAtBook } = fareQuotes.combined;

    let minDate: Dayjs | undefined;
    let maxDate: Dayjs | undefined;
    const currDate = dayjs();
    const handleFormSubmit = async (submitForm: () => void) => {
        await submitForm();
    };

    // Use current date as fallback if departureDate is not available
    const { PreferredDepartureTime: departureDate } =
        flightSegments[flightSegments.length - 1 || 0] || {};
    const departureDateDayjs = departureDate ? dayjs(departureDate) : dayjs();
    const passPortExpMin = departureDateDayjs.add(1, 'day');
    if (passengerType === 'adult') {
        minDate = undefined;
        maxDate = departureDateDayjs.subtract(12, 'year').subtract(1, 'day');
    }
    if (passengerType === 'child') {
        minDate = departureDateDayjs.subtract(12, 'year');
        maxDate = departureDateDayjs.subtract(2, 'year').subtract(1, 'day');
    }
    if (passengerType === 'infant') {
        minDate = departureDateDayjs.subtract(2, 'year');
        maxDate = dayjs();
    }

    const passengerBookingData = bookingData?.find((datas: any) => datas.passengerId === cardTitle);

    // const getCountryByCountryCode = (countryCode: string) =>
    //     countryData.find(country => country.value === countryCode);

    const [isPassengerValid, setIsPassengerValid] = useState(false);

    const handleCheckboxChange = (e: any, values: any) => {
        const isThisChecked = e.target.checked;
        if (isThisChecked) {
            // Pre-fill ReceiverDetails with phone and email
            if (values.ContactNo && values.Email && values.CellCountryCode) {
                setReceiverDetails({
                    phone: values.ContactNo,
                    email: values.Email,
                    phoneCode: values.CellCountryCode,
                });
                dispatch(
                    setContactInfoPassenger({
                        contactInfoPassenger: cardTitle,
                    })
                );
            }
        } else {
            // Clear ReceiverDetails fields
            setReceiverDetails({
                phone: '',
                email: '',
                phoneCode: '',
            });
            dispatch(
                setContactInfoPassenger({
                    contactInfoPassenger: '',
                })
            );
        }
    };

    const handleContactDetailsUpdate = (values: any) => {
        if (contactInfoPassenger === cardTitle) {
            setReceiverDetails({
                phone: values.ContactNo,
                email: values.Email,
                phoneCode: values.CellCountryCode,
            });
        }
    };

    const getNamePrefix = (genderValue: number) => {
        if (passengerType === 'adult') {
            return genderValue === 1 ? 'Mr' : 'Mrs';
        }
        return genderValue === 1 ? 'Mstr' : 'Miss';
    };

    function isContactDetailsFilled(values: any) {
        return values.ContactNo && values.Email && values.CellCountryCode;
    }

    const cleanAddressString = (input: string) => input.replace(/[^a-zA-Z0-9,\- ]/g, '');

    return (
        <Col span={24}>
            <Card
                styles={{
                    body: {
                        paddingTop: 25,
                        paddingBottom: 15,
                        paddingLeft: 28,
                        paddingRight: 28,
                        border: '0',
                    },
                }}
                className="my-4 rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
            >
                <Row className="mb-8">
                    <Paragraph className="text-lg font-medium leading-7 capitalize">
                        Add {cardTitle}
                    </Paragraph>
                </Row>
                <Row>
                    <Formik<FormValues>
                        initialValues={{
                            passengerId: cardTitle,
                            employee: '',
                            Title: passengerBookingData?.Title || getNamePrefix(gender),
                            FirstName: passengerBookingData?.FirstName || '',
                            LastName: passengerBookingData?.LastName || '',
                            PaxType: getPaxType(passengerType),
                            DateOfBirth: passengerBookingData?.DateOfBirth || '',
                            Gender: passengerBookingData?.Gender || 1,
                            PassportNo: passengerBookingData?.PassportNo || '',
                            PassportExpiry: passengerBookingData?.PassportExpiry || '',
                            PassportIssueDate: passengerBookingData?.PassportIssueDate || '',
                            AddressLine1: passengerBookingData?.AddressLine1 || '',
                            AddressLine2: passengerBookingData?.AddressLine2 || '',
                            City: passengerBookingData?.City || '',
                            CellCountryCode: passengerBookingData?.CellCountryCode || '+91',
                            ContactNo: passengerBookingData?.ContactNo || '',
                            Email: passengerBookingData?.Email || '',
                            IsLeadPax: cardTitle === 'Adult Passenger 1',
                            Fare: getFairDetails(fareQuotes.combined, passengerType),
                            OutbountFare: getFairDetails(fareQuotes.outbount, passengerType),
                            InbountFare: getFairDetails(fareQuotes.inbount, passengerType),
                            MealDynamic: [],
                            Baggage: [],
                            SeatDynamic: [],
                            // CountryCode: passengerBookingData?.CountryCode || '',
                            // CountryName: passengerBookingData?.CountryName || '',
                            // Nationality: passengerBookingData?.Nationality || '',
                            Nationality: 'IN',
                            CountryCode: 'IN',
                            CountryName: 'India',
                            PAN: passengerBookingData?.PAN || '',
                        }}
                        innerRef={formRef}
                        validateOnMount
                        validationSchema={passengerValidation(
                            isPassportRequired,
                            IsPassportFullDetailRequiredAtBook,
                            isPanRequired,
                            idDObRequired,
                            departureDateDayjs.toISOString()
                        )}
                        onSubmit={values => {
                            const today = new Date();
                            const dob = new Date(values.DateOfBirth);
                            const age = today.getFullYear() - dob.getFullYear();

                            if (passengerType === 'adult') {
                                if (age < 12) {
                                    dispatch(
                                        showToast({
                                            description:
                                                'Age of adult passenger should be greater than 12',
                                            variant: 'error',
                                        })
                                    );
                                    return;
                                }
                            } else if (passengerType === 'child') {
                                if (age < 2 || age > 12) {
                                    dispatch(
                                        showToast({
                                            description:
                                                'Age of child passenger should between 2 and 12',
                                            variant: 'error',
                                        })
                                    );
                                    return;
                                }
                            } else if (passengerType === 'infant') {
                                if (age > 2) {
                                    dispatch(
                                        showToast({
                                            description: 'Age of infant passenger should below 2',
                                            variant: 'error',
                                        })
                                    );
                                    return;
                                }
                            }

                            if (IsPassportFullDetailRequiredAtBook) {
                                values.PassportIssueCountryCode = 'IN';
                            }

                            dispatch(addPassengersData(values));
                        }}
                    >
                        {({
                            handleSubmit,
                            values,
                            handleChange,
                            errors,
                            isValid,
                            setFieldValue,
                            submitForm,
                        }) => {
                            if (isPassengerValid !== isValid) {
                                setIsPassengerValid(isValid);
                                updatePassengerValidity(isValid);
                            }
                            return (
                                <Form
                                    ref={formDomRef}
                                    onSubmit={handleSubmit}
                                    onBlur={() => {
                                        if (isValid) handleFormSubmit(submitForm);
                                    }}
                                    onLoad={() => {
                                        if (
                                            contactInfoPassenger === cardTitle &&
                                            isContactDetailsFilled(values)
                                        ) {
                                            setReceiverDetails({
                                                phone: values.ContactNo,
                                                email: values.Email,
                                                phoneCode: values.CellCountryCode,
                                            });
                                        }
                                    }}
                                    className="w-full"
                                    id="airlineBtn"
                                >
                                    <Row className="mb-3">
                                        <Col style={{ width: 400, maxWidth: '100%' }}>
                                            <TravellerSelector
                                                name="employee"
                                                label="Select Employee/Passenger"
                                                employeeOptions={
                                                    isPurchased
                                                        ? (generateEmployeesDropdown(
                                                              employeeList
                                                          ) as any)
                                                        : []
                                                }
                                                savedOptions={generateSavedTravellersDropdown(
                                                    savedTravellers
                                                )}
                                                onSelect={option => {
                                                    applyToAirlineForm(
                                                        setFieldValue,
                                                        option,
                                                        getNamePrefix,
                                                        setGender
                                                    );
                                                    setSelectedBaselineKey(
                                                        optionIdentityKey(option)
                                                    );
                                                    setSelectedSavedId(
                                                        option.source === 'saved'
                                                            ? (option.savedId ?? null)
                                                            : null
                                                    );
                                                    if (isValid) handleFormSubmit(submitForm);
                                                }}
                                                onDeleteSaved={async savedId => {
                                                    await handleDeleteSaved(savedId);
                                                    if (savedId === selectedSavedId) {
                                                        clearAutofilledFields(setFieldValue);
                                                    }
                                                }}
                                                onClear={() => clearAutofilledFields(setFieldValue)}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className="mb-4">
                                        <Col span={24}>
                                            <Flex
                                                style={{
                                                    background: '#fffcef',
                                                    border: '1px solid #f7d9b6',
                                                    borderRadius: 6,
                                                    padding: '9px 15px 9px 14px',
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <Typography.Text
                                                    style={{
                                                        color: '#9c6526',
                                                        fontSize: 14,
                                                        lineHeight: '18px',
                                                    }}
                                                >
                                                    Make sure to enter your name exactly as it
                                                    appears on your government ID.
                                                </Typography.Text>
                                            </Flex>
                                        </Col>
                                    </Row>
                                    <Row className="flex flex-col">
                                        <Radio.Group
                                            value={values.Gender}
                                            onChange={async e => {
                                                setFieldValue('Gender', e.target.value);
                                                setGender(e.target.value);
                                                setFieldValue(
                                                    'Title',
                                                    getNamePrefix(e.target.value)
                                                );
                                            }}
                                        >
                                            <Radio value={1}>Male</Radio>
                                            <Radio value={2}>Female</Radio>
                                        </Radio.Group>
                                        <Typography.Text className="mt-2 text-red-500">
                                            {typeof errors.Gender === 'string' ? errors.Gender : ''}
                                        </Typography.Text>
                                    </Row>
                                    <Row className="mt-2" gutter={[24, 0]}>
                                        <Col sm={12} xxl={10} >
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    First Name
                                                </Typography.Text>
                                                <TextInput
                                                    name="FirstName"
                                                    placeholder="First Name"
                                                    type="text"
                                                    allowAlphabetsAndSpaceOnly
                                                    isRequired
                                                    maxLength={50}
                                                />
                                            </Flex>
                                        </Col>

                                        <Col sm={12}  xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    Last Name
                                                </Typography.Text>
                                                <TextInput
                                                    name="LastName"
                                                    placeholder="Last Name"
                                                    type="text"
                                                    allowAlphabetsAndSpaceOnly
                                                    isRequired
                                                    maxLength={50}
                                                />
                                            </Flex>
                                        </Col>

                                        {idDObRequired && (
                                            <Col sm={12}  xxl={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                        <Typography.Text>
                                                            Date of Birth
                                                        </Typography.Text>
                                                    </Typography.Text>
                                                    <DatePickerInput
                                                        placeholder="Select Date"
                                                        name="DateOfBirth"
                                                        classes="w-full"
                                                        maxDate={maxDate}
                                                        isRequired
                                                        minDate={minDate}
                                                        needConfirm={false}
                                                    />
                                                </Flex>
                                            </Col>
                                        )}

                                        {isPassportRequired && (
                                            <Col sm={12}  xxl={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                        Passport No
                                                    </Typography.Text>
                                                    <TextInput
                                                        name="PassportNo"
                                                        isRequired
                                                        allowAlphabetsAndNumbersOnly
                                                        handleChange={value => {
                                                            setFieldValue(
                                                                'PassportNo',
                                                                value.toUpperCase()
                                                            );
                                                        }}
                                                        // allowUpperCaseOnly
                                                        placeholder="Passport No"
                                                        type="text"
                                                        maxLength={20}
                                                    />
                                                </Flex>
                                            </Col>
                                        )}

                                        {/* <Col className="mr-10 " sm={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    Nationality
                                                </Typography.Text>
                                                <SelectInputWithSearch
                                                    isRequired
                                                    name="Nationality"
                                                    options={countryData ?? []}
                                                    placeholder="Nationality"
                                                    classes="rounded-sm"
                                                    handleChange={value => {
                                                        const country =
                                                            getCountryByCountryCode(value);
                                                        if (country) {
                                                            setFieldValue(
                                                                'CountryCode',
                                                                country.value
                                                            );
                                                            setFieldValue(
                                                                'CountryName',
                                                                country.label
                                                            );
                                                        }
                                                    }}
                                                />
                                            </Flex>
                                        </Col> */}

                                        {isPassportRequired && (
                                            <Col sm={12} xxl={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                        Expiry Date
                                                    </Typography.Text>
                                                    <DatePickerInput
                                                        placeholder="Select Date"
                                                        name="PassportExpiry"
                                                        classes="w-full"
                                                        minDate={passPortExpMin}
                                                        isRequired
                                                        needConfirm={false}
                                                    />
                                                </Flex>
                                            </Col>
                                        )}

                                        {IsPassportFullDetailRequiredAtBook && (
                                            <Col sm={12} xxl={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                        Passport Issued Date
                                                    </Typography.Text>
                                                    <DatePickerInput
                                                        placeholder="Select Date"
                                                        name="PassportIssueDate"
                                                        isRequired
                                                        classes="w-full"
                                                        maxDate={currDate}
                                                        needConfirm={false}
                                                    />
                                                </Flex>
                                            </Col>
                                        )}

                                        <Col sm={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    Email ID
                                                </Typography.Text>
                                                <TextInput
                                                    type="text"
                                                    placeholder="Enter Email ID"
                                                    name="Email"
                                                    classes="w-full"
                                                    allowEmailsOnly
                                                    isRequired
                                                    maxLength={50}
                                                    handleChange={value => {
                                                        handleContactDetailsUpdate({
                                                            ...values,
                                                            Email: value,
                                                        });
                                                    }}
                                                />
                                            </Flex>
                                        </Col>

                                        <Col sm={12} xxl={10}>
                                            <Typography.Text>
                                                <Typography.Text className="text-red-500 me-1">
                                                    *
                                                </Typography.Text>
                                                Mobile Number
                                            </Typography.Text>
                                            <Flex className="mt-2">
                                                <Flex vertical>
                                                    <Select
                                                        showSearch
                                                        options={phoneCodes ?? []}
                                                        placeholder="Select Phone Code"
                                                        value={values.CellCountryCode}
                                                        onSelect={e => {
                                                            handleChange('CellCountryCode')(e);
                                                            handleContactDetailsUpdate({
                                                                ...values,
                                                                CellCountryCode: e,
                                                            });
                                                        }}
                                                        className="w-[100px] hover-pointer"
                                                        filterOption={(input: string, option) =>
                                                            (
                                                                (option &&
                                                                    // @ts-ignore
                                                                    option?.label.toLowerCase()) ??
                                                                ''
                                                            ).includes(input.toLowerCase())
                                                        }
                                                    />
                                                    <Typography.Text className="mt-2 text-red-500">
                                                        {typeof errors.Gender === 'string'
                                                            ? errors.Gender
                                                            : ''}
                                                    </Typography.Text>
                                                </Flex>
                                                <Flex vertical className="pl-2 w-full">
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter Mobile Number"
                                                        name="ContactNo"
                                                        allowNumbersOnly
                                                        maxLength={10}
                                                        isRequired
                                                        handleChange={value => {
                                                            handleContactDetailsUpdate({
                                                                ...values,
                                                                ContactNo: value,
                                                            });
                                                        }}
                                                    />
                                                </Flex>
                                            </Flex>
                                        </Col>

                                        <Col sm={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    Address Line 1
                                                </Typography.Text>
                                                <TextInput
                                                    name="AddressLine1"
                                                    isRequired
                                                    allowedInputKeys={cleanAddressString}
                                                    placeholder="Enter Address Line 1"
                                                    type="text"
                                                    maxLength={50}
                                                />
                                            </Flex>
                                        </Col>

                                        <Col sm={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>Address Line 2</Typography.Text>
                                                <TextInput
                                                    name="AddressLine2"
                                                    isRequired
                                                    placeholder="Enter Address Line 2"
                                                    type="text"
                                                    allowedInputKeys={cleanAddressString}
                                                    maxLength={50}
                                                />
                                            </Flex>
                                        </Col>

                                        <Col sm={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    <Typography.Text className="text-red-500 me-1">
                                                        *
                                                    </Typography.Text>
                                                    City
                                                </Typography.Text>{' '}
                                                <TextInput
                                                    name="City"
                                                    isRequired
                                                    allowAlphabetsSpaceAndNumbersOnly
                                                    // allowUpperCaseOnly
                                                    placeholder="Enter City"
                                                    type="text"
                                                    maxLength={50}
                                                />
                                            </Flex>
                                        </Col>

                                        {isPanRequired && (
                                            <Col sm={12} xxl={10}>
                                                <Flex vertical gap="small">
                                                    <Typography.Text>
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                        PAN number
                                                    </Typography.Text>
                                                    <TextInput
                                                        type="text"
                                                        placeholder="Enter PAN number"
                                                        name="PAN"
                                                        classes="w-full"
                                                        allowAlphabetsAndNumbersOnly
                                                        isRequired
                                                        maxLength={50}
                                                    />
                                                </Flex>
                                            </Col>
                                        )}

                                        <Col className="mr-6" sm={20}>
                                            {cardTitle.includes('Adult') && (
                                                <Flex vertical gap="small">
                                                    <CheckboxInput
                                                        name={cardTitle}
                                                        isRequired
                                                        checked={
                                                            contactInfoPassenger === cardTitle &&
                                                            isContactDetailsFilled(values)
                                                        }
                                                        onChange={async e => {
                                                            handleCheckboxChange(e, values);
                                                        }}
                                                        disabled={
                                                            !!contactInfoPassenger &&
                                                            contactInfoPassenger !== cardTitle
                                                        }
                                                    >
                                                        Use the same contact information for sending
                                                        booking details
                                                    </CheckboxInput>
                                                </Flex>
                                            )}
                                        </Col>
                                        {shouldShowSaveCheckbox(values) &&
                                            (canSaveMore ? (
                                                <Col className="mr-10 mt-2" sm={20}>
                                                    <Checkbox
                                                        checked={false}
                                                        disabled={isSavingTraveller}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                handleSaveTraveller(values);
                                                            }
                                                        }}
                                                    >
                                                        Save passenger
                                                    </Checkbox>
                                                </Col>
                                            ) : (
                                                <Col className="mr-10 mt-2" sm={20}>
                                                    <Typography.Text className="text-xs text-gray-500">
                                                        You&apos;ve saved the maximum of{' '}
                                                        {savedTravellersLimit} passengers. Remove one
                                                        to save another.
                                                    </Typography.Text>
                                                </Col>
                                            ))}
                                    </Row>
                                </Form>
                            );
                        }}
                    </Formik>
                </Row>
            </Card>
        </Col>
    );
};

export default PassengerCard;
