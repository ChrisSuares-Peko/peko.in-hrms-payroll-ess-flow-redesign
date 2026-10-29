import { useState } from 'react';

import { Checkbox, Flex, Form, Radio, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import TravellerSelector from '@components/molecular/traveller-selector/TravellerSelector';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { useSavedTravellers } from '@src/hooks/useSavedTravellers';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { fullTravellerKey, nameDobKey, optionToIdentifiable } from '@utils/travellerIdentity';

import { useGetEmployee } from '../../hooks/useGetEmployeeApi';
import { passengerValidation } from '../../schema/travellerData';
import { addPassengersData, setContactInfoPassenger } from '../../slices/airlineSlice';
import { getFairDetails, getPaxType } from '../../utils/passengerDetails';
import {
    airlineValuesToSavedPayload,
    applyToAirlineForm,
    optionIdentityKey,
} from '../../utils/savedTravellerAdapter';

interface PassengerModalProps {
    open: boolean;
    handleCancel: () => void;
    handleSubmit: (val: {}) => void;
    passengerType: 'adult' | 'child' | 'infant';
    cardTitle: string;
    isNewPassenger: boolean;
    fareQuotes: any;
    countryData: any[];
    phoneCodes: any[];
    setReceiverDetails: any;
}

const PassengerModal = ({
    open,
    handleCancel,
    handleSubmit,
    passengerType,
    cardTitle,
    isNewPassenger,
    fareQuotes,
    countryData,
    phoneCodes,
    setReceiverDetails,
}: PassengerModalProps) => {
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

    // should be valid till last flight departure
    let minDate: Dayjs | undefined;
    let maxDate: Dayjs | undefined;
    // Use current date as fallback if departureDate is not available
    const { PreferredDepartureTime: departureDate } =
        flightSegments[flightSegments.length - 1 || 0] || {};
    const departureDateDayjs = departureDate ? dayjs(departureDate) : dayjs();
    const passPortExpMin = departureDateDayjs.add(1, 'day');
    const currDate = dayjs();
    if (passengerType === 'adult') {
        minDate = undefined;
        maxDate = departureDateDayjs.subtract(12, 'year');
    }
    if (passengerType === 'child') {
        minDate = departureDateDayjs.subtract(12, 'year');
        maxDate = departureDateDayjs.subtract(2, 'year');
    }
    if (passengerType === 'infant') {
        minDate = departureDateDayjs.subtract(2, 'year');
        maxDate = dayjs();
    }

    const bookingData = useAppSelector(state => state.reducer.airline.bookingData.passengers);
    const passengerBookingData = bookingData?.find((datas: any) => datas.passengerId === cardTitle);

    const getNamePrefix = (genderValue: number) => {
        if (passengerType === 'adult') {
            return genderValue === 1 ? 'Mr' : 'Mrs';
        }
        return genderValue === 1 ? 'Mstr' : 'Miss';
    };

    function isContactDetailsFilled(values: any) {
        return values.ContactNo && values.Email && values.CellCountryCode;
    }

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
    return (
        <CustomModalWithForm
            modalTitle={`${isNewPassenger ? `Add` : `Edit`} ${cardTitle}`}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={val => {
                const today = new Date();
                const dob = new Date(val.dob);
                const age = today.getFullYear() - dob.getFullYear();
                const valPassengerType = val.passengerType;
                if (valPassengerType === 'adult' && age < 12) {
                    dispatch(
                        showToast({
                            description: 'Age of adult passenger should be greater than 12',
                            variant: 'error',
                        })
                    );
                    return;
                }
                if (valPassengerType === 'child' && (age < 3 || age > 12)) {
                    dispatch(
                        showToast({
                            description: 'Age of child passenger should between 3 and 12',
                            variant: 'error',
                        })
                    );
                    return;
                }
                if (valPassengerType === 'infant' && age > 3) {
                    dispatch(
                        showToast({
                            description: 'Age of infant passenger should below 3',
                            variant: 'error',
                        })
                    );
                    return;
                }
                dispatch(addPassengersData(val));
                handleSubmit(val);
            }}
            validationSchema={passengerValidation(
                isPassportRequired,
                IsPassportFullDetailRequiredAtBook,
                isPanRequired,
                idDObRequired,
                departureDateDayjs.toISOString()
            )}
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
                Nationality: 'IN',
                CountryCode: 'IN',
                CountryName: 'India',
                PAN: passengerBookingData?.PAN || '',
            }}
            // reinitialise
        >
            {({ values, handleChange, setFieldValue, errors }) => (
                <Flex vertical className="w-full mt-6">
                    <Form layout="vertical">
                        <div className="mb-4">
                            <TravellerSelector
                                name="employee"
                                label="Select Employee/Passenger"
                                employeeOptions={
                                    isPurchased
                                        ? (generateEmployeesDropdown(employeeList) as any)
                                        : []
                                }
                                savedOptions={generateSavedTravellersDropdown(savedTravellers)}
                                onSelect={option => {
                                    applyToAirlineForm(
                                        setFieldValue,
                                        option,
                                        getNamePrefix,
                                        setGender
                                    );
                                    setSelectedBaselineKey(optionIdentityKey(option));
                                    setSelectedSavedId(
                                        option.source === 'saved' ? (option.savedId ?? null) : null
                                    );
                                }}
                                onDeleteSaved={async savedId => {
                                    await handleDeleteSaved(savedId);
                                    if (savedId === selectedSavedId) {
                                        clearAutofilledFields(setFieldValue);
                                    }
                                }}
                                onClear={() => clearAutofilledFields(setFieldValue)}
                            />
                        </div>
                        <Radio.Group
                            className="mb-4"
                            value={values.Gender}
                            onChange={async e => {
                                setFieldValue('Gender', e.target.value);
                                setGender(e.target.value);
                                setFieldValue('Title', getNamePrefix(e.target.value));
                            }}
                        >
                            <Radio value={1}>Male</Radio>
                            <Radio value={2}>Female</Radio>
                        </Radio.Group>
                        {/* <SelectInput
                            label="Name Title"
                            name="Title"
                            options={getTitleOptions(passengerType!, gender) ?? []}
                            placeholder="Select Title"
                            classes="w-10/12"
                            isRequired
                        /> */}
                        <TextInput
                            name="FirstName"
                            label="First Name"
                            type="text"
                            placeholder="Enter First Name"
                            classes=" rounded-sm"
                            allowAlphabetsAndSpaceOnly
                            isRequired
                            maxLength={50}
                        />
                        <TextInput
                            name="LastName"
                            label="Last Name"
                            type="text"
                            placeholder="Enter Last Name"
                            classes=" rounded-sm"
                            allowAlphabetsAndSpaceOnly
                            isRequired
                            maxLength={50}
                        />
                        {idDObRequired && (
                            <DatePickerInput
                                placeholder="Select Date Of Birth"
                                name="DateOfBirth"
                                classes=" rounded-sm w-full"
                                label="Date of Birth"
                                maxDate={maxDate}
                                minDate={minDate}
                                needConfirm={false}
                                isRequired={idDObRequired}
                            />
                        )}
                        {isPassportRequired && (
                            <TextInput
                                name="PassportNo"
                                label="Passport No"
                                type="text"
                                placeholder="Enter Passport No"
                                classes=" rounded-sm"
                                allowAlphabetsAndNumbersOnly
                                // allowUpperCaseOnly
                                isRequired={isPassportRequired}
                                maxLength={50}
                            />
                        )}
                        {isPassportRequired && (
                            <DatePickerInput
                                placeholder="Select Date"
                                name="PassportExpiry"
                                classes="rounded-sm w-full"
                                label="Expiry Date"
                                minDate={passPortExpMin}
                                needConfirm={false}
                                isRequired={isPassportRequired}
                            />
                        )}
                        {IsPassportFullDetailRequiredAtBook && (
                            <DatePickerInput
                                placeholder="Select Date"
                                name="PassportIssueDate"
                                classes="rounded-sm w-full"
                                label="Passport Issued Date"
                                maxDate={currDate}
                                needConfirm={false}
                                isRequired={IsPassportFullDetailRequiredAtBook}
                            />
                        )}
                        <TextInput
                            name="Email"
                            label="Email ID"
                            type="text"
                            placeholder="Enter Email ID"
                            classes=" rounded-sm"
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
                        <TextInput
                            name="ContactNo"
                            label="Mobile Number"
                            type="text"
                            placeholder="Enter Mobile Number"
                            classes=" rounded-sm"
                            allowAlphabetsAndNumbersOnly
                            isRequired
                            maxLength={10}
                            handleChange={value => {
                                handleContactDetailsUpdate({
                                    ...values,
                                    ContactNo: value,
                                });
                            }}
                        />
                        <TextInput
                            name="AddressLine1"
                            label="Address Line 1"
                            type="text"
                            placeholder="Enter Address Line 1"
                            classes=" rounded-sm"
                            allowAlphabetsAndNumbersOnly
                            // allowUpperCaseOnly
                            isRequired
                            maxLength={50}
                        />
                        <TextInput
                            name="AddressLine2"
                            label="Address Line 2"
                            type="text"
                            placeholder="Enter Address Line 2"
                            classes=" rounded-sm"
                            allowAlphabetsAndNumbersOnly
                            // allowUpperCaseOnly
                            maxLength={50}
                        />
                        <TextInput
                            name="City"
                            label="City"
                            type="text"
                            placeholder="Enter City"
                            classes=" rounded-sm"
                            allowAlphabetsAndNumbersOnly
                            isRequired
                            // allowUpperCaseOnly
                            maxLength={50}
                        />
                        {/* <SelectInput
                            label="Nationality"
                            name="Nationality"
                            placeholder="Select Nationality"
                            options={countryData ?? []}
                            isRequired
                        /> */}
                        {isPanRequired && (
                            <TextInput
                                name="PAN"
                                label="PAN number"
                                type="text"
                                placeholder="Enter PAN number"
                                classes=" rounded-sm"
                                allowAlphabetsAndNumbersOnly
                                isRequired={isPanRequired}
                                maxLength={50}
                            />
                        )}

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
                                        !!contactInfoPassenger && contactInfoPassenger !== cardTitle
                                    }
                                >
                                    Use the same contact information for sending booking details
                                </CheckboxInput>
                            </Flex>
                        )}
                        {shouldShowSaveCheckbox(values) &&
                            (canSaveMore ? (
                                <Flex vertical gap="small" className="mt-2">
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
                                </Flex>
                            ) : (
                                <Flex vertical gap="small" className="mt-2">
                                    <Typography.Text className="text-xs text-gray-500">
                                        You&apos;ve saved the maximum of {savedTravellersLimit}{' '}
                                        passengers. Remove one to save another.
                                    </Typography.Text>
                                </Flex>
                            ))}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default PassengerModal;
