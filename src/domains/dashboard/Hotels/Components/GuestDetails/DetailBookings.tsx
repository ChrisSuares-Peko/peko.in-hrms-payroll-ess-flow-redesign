import { useState } from 'react';

import { Card, Checkbox, Col, Flex, Radio, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import TravellerSelector from '@components/molecular/traveller-selector/TravellerSelector';
import { useAppSelector } from '@src/hooks/store';
import { useSavedTravellers } from '@src/hooks/useSavedTravellers';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import {
    fullTravellerKey,
    nameDobKey,
    optionIdentityKey,
    optionToIdentifiable,
} from '@utils/travellerIdentity';

import { nameSanitizerRegex, NameValidationConfig, userDetailsSchema } from '../../schema';
import { TotalFormCount, addPassengersData, addUserData } from '../../slices/getHotelSlice';
import { employeeTypes } from '../../types/types';
import { hotelValuesToSavedPayload, optionToHotelPatch } from '../../utils/savedGuestAdapter';

const { Text } = Typography;

type Props = {
    passengerType: string;
    passengerKey: number;
    roomIndex: number;
    roomKey: string;
    formRef: React.MutableRefObject<any>;
    totalForm: string[];
    setTotalForm: any;
    childAge?: number;
    totalPassengers?: any;
    passengerCount?: number;
    data: employeeTypes[];
    isLoading?: boolean;
     generateEmployeesDropdown: (data: employeeTypes[]) => {
        fullName: string;
        value: string;
        label: string;
        dateOfBirth: string;
        gender: string;
        mobileNo: string;
        personalEmail: string;
        passportExpiryDate: string;
    }[];
    userdetails: any;
    setEnteredForm: any;
    passengervalue: any;
};

const DetailBookings = ({
    passengerType,
    passengerKey,
    roomIndex,
    roomKey,
    formRef,
    totalForm,
    setTotalForm,
    childAge,
    totalPassengers,
    passengerCount,
    data,
    generateEmployeesDropdown,
    userdetails,
    isLoading,
    setEnteredForm,
    passengervalue,
}: Props) => {
    const dispatch = useDispatch();
    const ageChild = childAge as number;

    const formKey = `${roomIndex}-${passengerType}-${passengerKey}`;

    const {  prebookResponse } = useAppSelector(
        state => state.reducer.hotels
    );

    const handleFormSubmit = async (submitForm: () => void) => {
        await submitForm();
    };

    let minDate: Dayjs | undefined;
    let maxDate: Dayjs | undefined;

    if (passengerType === 'adult') {
        minDate = undefined;
        maxDate = dayjs().subtract(18, 'year');
    }
    if (passengerType === 'child') {
        minDate = dayjs()
            .subtract(ageChild + 1, 'year')
            .add(1, 'day');
        maxDate = dayjs().subtract(ageChild, 'year');
    }

    const currentPassenger = userdetails
        ?.find((detail: any) => detail.roomIndex === roomIndex)
        ?.passengers?.find((passenger: any) => passenger.passengerKey === passengerKey);

    const isPassportRequired = prebookResponse.ValidationInfo.PassportMandatory;
    const isPanRequired = prebookResponse.ValidationInfo.PanMandatory;

    // Name-field rules (length/allowed characters) come from the hotel supplier's own prebook
    // response — they vary per hotel/rate, so this can't be a hardcoded constant.
    const nameValidationConfig: NameValidationConfig = {
        charLimitEnabled: prebookResponse.ValidationInfo.CharLimit,
        minLength: prebookResponse.ValidationInfo.PaxNameMinLength,
        maxLength: prebookResponse.ValidationInfo.PaxNameMaxLength,
        spaceAllowed: prebookResponse.ValidationInfo.SpaceAllowed,
        specialCharAllowed: prebookResponse.ValidationInfo.SpecialCharAllowed,
    };
   
     const isPurchased = useServiceAccess(accessKeys.payroll);

    const {
        data: savedGuests,
        limit: savedGuestsLimit,
        canSaveMore,
        generateSavedTravellersDropdown,
        saveTraveller,
        removeTraveller,
    } = useSavedTravellers(accessKeys.hotels);
    const [isSavingGuest, setIsSavingGuest] = useState(false);
    const [selectedBaselineKey, setSelectedBaselineKey] = useState<string | null>(null);
    const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);

    const handleSaveGuest = async (formValues: any) => {
        const payload = hotelValuesToSavedPayload(formValues);
        if (!payload) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Enter first and last name before saving.',
                })
            );
            return;
        }
        setIsSavingGuest(true);
        const res = await saveTraveller(payload);
        setIsSavingGuest(false);
        if (res.ok) {
            setSelectedBaselineKey(fullTravellerKey(payload));
            dispatch(showToast({ variant: 'success', description: 'Guest saved for reuse' }));
        } else if (res.atLimit) {
            dispatch(
                showToast({
                    variant: 'warning',
                    description: res.message || 'You have reached the saved guest limit.',
                })
            );
        }
    };

    const handleDeleteSaved = async (savedId: number) => {
        const ok = await removeTraveller(savedId);
        if (ok) {
            dispatch(showToast({ variant: 'success', description: 'Saved guest removed' }));
        }
    };

    const shouldShowSaveCheckbox = (formValues: any) => {
        const payload = hotelValuesToSavedPayload(formValues);
        if (!payload) return false;
        if (selectedBaselineKey && fullTravellerKey(payload) === selectedBaselineKey) {
            return false;
        }
        if ((savedGuests || []).some(t => fullTravellerKey(t) === fullTravellerKey(payload))) {
            return false;
        }
        const empList = isPurchased ? generateEmployeesDropdown(data) : [];
        if (empList.some(o => nameDobKey(optionToIdentifiable(o as any)) === nameDobKey(payload))) {
            return false;
        }
        return true;
    };

    return (
        <Content className="">
            <Card
                bodyStyle={{
                    paddingTop: 25,
                    paddingBottom: 25,
                    paddingLeft: 28,
                    paddingRight: 28,
                    border: '0',
                }}
                className={`rounded-[28px] border border-[#ececec] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)] ${
                    roomIndex === 1 && passengerKey === 1 ? '' : 'my-6'
                }`}
            >
                <Text className="font-medium text-lg">
                    {passengerType === 'adult' ? 'Adult' : 'Child'} Guest {passengervalue}
                </Text>
                <Row className="mt-3">
                    <Formik
                        key={passengerKey}
                        initialValues={{
                            employee: '',
                            firstName: currentPassenger?.FirstName || '',
                            lastName: currentPassenger?.LastName || '',
                            dob: currentPassenger?.dob || '',
                            email: currentPassenger?.Email || '',
                            passengerType,
                            gender:
                                // eslint-disable-next-line no-nested-ternary
                                currentPassenger?.Title === 'Mr'
                                    ? 'M'
                                    : currentPassenger?.Title === 'Mrs'
                                      ? 'F'
                                      : 'M',
                            phone: currentPassenger?.Phoneno || '',
                            meal: currentPassenger?.mealPreference || false,
                            pan: currentPassenger?.PAN || null,
                            passportNo: currentPassenger?.PassportNo || null,
                            passportIssueDate: null,
                            passportExpDate: null,
                            isPassportRequired: prebookResponse.ValidationInfo.PassportMandatory,
                            isPanRequired: prebookResponse.ValidationInfo.PanMandatory,
                        }}
                        innerRef={formRef}
                        validationSchema={userDetailsSchema(
                            passengerType === 'adult' && passengerKey === 1,
                            nameValidationConfig
                        )}
                        validateOnChange
                        validateOnBlur
                        onSubmit={(values, { setSubmitting }) => {
                            const bookingRoom: any = [];
                            const today = new Date();
                            const dob = new Date(values.dob);
                            const age = today.getFullYear() - dob.getFullYear();
                          

                            if (passengerType === 'adult') {
                              
                                if (age < 12) {
                                    dispatch(
                                        showToast({
                                            description:
                                                'Age of adult guest should be greater than 12',
                                            variant: 'error',
                                        })
                                    );
                                }
                            } else if (passengerType === 'child') {
                               
                                if (age > 12) {
                                    dispatch(
                                        showToast({
                                            description: 'Age of child guest should less than 12',
                                            variant: 'error',
                                        })
                                    );
                                }
                            }

                            // Trim leading/trailing spaces and collapse doubled-up spaces
                            // before saving, rather than blocking the user for them.
                            const normalizeName = (value?: string) =>
                                (value || '').trim().replace(/\s{2,}/g, ' ');

                            const passengerData = {
                                passengerKey,
                                Title: values.gender === 'M' ? 'Mr' : 'Mrs',
                                FirstName: normalizeName(values?.firstName),
                                MiddleName: '',
                                LastName: normalizeName(values?.lastName),
                                Email: values.email,
                                PaxType: passengerType === 'adult' ? 1 : 2,
                                LeadPassenger:
                                    passengerType === 'adult' &&
                                    passengerKey === 1 &&
                                    roomIndex === 0,
                                Age: age,
                                PassportNo: values.passportNo || null,
                                PassportIssueDate: values.passportIssueDate || null,
                                PassportExpDate: values.passportExpDate || null,
                                Phoneno: values.phone || null,
                                PaxId: 0,
                                GSTCompanyAddress: null,
                                GSTCompanyContactNumber: null,
                                GSTCompanyName: null,
                                GSTNumber: null,
                                GSTCompanyEmail: null,
                                PAN: values.pan || null,
                                dob: values?.dob?.split('T')[0] || null,
                            };

                            if (
                                values.firstName &&
                                values.lastName &&
                                values.dob &&
                                // values.email &&
                                values.gender
                            ) {
                                if (!totalForm.includes(formKey)) {
                                    setTotalForm((prev: any) => {
                                        const updatedForms = [...prev, formKey];

                                        dispatch(TotalFormCount(updatedForms));
                                        return updatedForms;
                                    });

                                    setEnteredForm((prev: any) => [...prev, formKey]);
                                }
                            }

                            const existingPassengerIndex = bookingRoom.findIndex(
                                (passenger: any) =>
                                    Number(passenger.passengerKey) === Number(passengerKey)
                            );

                            if (existingPassengerIndex !== -1) {
                                bookingRoom[existingPassengerIndex] = {
                                    ...bookingRoom[existingPassengerIndex],
                                    ...passengerData,
                                };
                            } else {
                                bookingRoom.push(passengerData);
                            }

                            dispatch(addPassengersData(bookingRoom));
                            dispatch(
                                addUserData({ roomIndex, roomKey, userdetails: passengerData })
                            );
                            setSubmitting(false);
                        }}
                    >
                        {({
                            handleSubmit,
                            values,
                            handleChange,
                            setFieldValue,
                            setValues,
                            submitForm,
                            isSubmitting,
                            touched,
                            errors,
                            setFieldTouched,
                            validateField,
                        }) => (
                            <Form onSubmit={handleSubmit} className="w-full" id="hotelsbtn">
                                <Row className="mb-4">
                                    <Col style={{ width: 400, maxWidth: '100%' }}>
                                        {isLoading ? (
                                            <Col className="my-5">
                                                <Skeleton.Input active />
                                            </Col>
                                        ) : (
                                            <TravellerSelector
                                                name="employee"
                                                label="Select Employee/Guest"
                                                placeholder="Select employee or saved guest"
                                                employeeOptions={
                                                    isPurchased && passengerType === 'adult'
                                                        ? (generateEmployeesDropdown(data) as any)
                                                        : []
                                                }
                                                savedOptions={generateSavedTravellersDropdown(
                                                    savedGuests
                                                )}
                                                onSelect={async option => {
                                                    await setValues({
                                                        ...values,
                                                        ...optionToHotelPatch(option),
                                                    });
                                                    setSelectedBaselineKey(
                                                        optionIdentityKey(option)
                                                    );
                                                    setSelectedSavedId(
                                                        option.source === 'saved'
                                                            ? (option.savedId ?? null)
                                                            : null
                                                    );
                                                    handleFormSubmit(submitForm);
                                                }}
                                                onDeleteSaved={async savedId => {
                                                    await handleDeleteSaved(savedId);
                                                    if (savedId === selectedSavedId) {
                                                        await setValues({
                                                            ...values,
                                                            employee: '',
                                                            firstName: '',
                                                            lastName: '',
                                                            dob: '',
                                                            email: '',
                                                            phone: '',
                                                            pan: null,
                                                            passportNo: null,
                                                            passportIssueDate: null,
                                                            passportExpDate: null,
                                                        });
                                                        setSelectedBaselineKey(null);
                                                        setSelectedSavedId(null);
                                                    }
                                                }}
                                                onClear={async () => {
                                                    await setValues({
                                                        ...values,
                                                        employee: '',
                                                        firstName: '',
                                                        lastName: '',
                                                        dob: '',
                                                        email: '',
                                                        phone: '',
                                                        pan: null,
                                                        passportNo: null,
                                                        passportIssueDate: null,
                                                        passportExpDate: null,
                                                    });
                                                    setSelectedBaselineKey(null);
                                                    setSelectedSavedId(null);
                                                }}
                                            />
                                        )}
                                    </Col>
                                </Row>
                                <Row>
                                    <Radio.Group
                                        value={values.gender}
                                        onChange={e => handleChange('gender')(e.target.value)}
                                    >
                                        <Radio value="M">Male</Radio>
                                        <Radio value="F" className="ml-2">
                                            Female
                                        </Radio>
                                    </Radio.Group>
                                </Row>
                                <Row gutter={[24, 0]}>
                                    <Col
                                        className="mt-3 w-full"
                                        md={12} xxl={10}
                                        // onBlur={() => handleFormSubmit(submitForm)}
                                    >
                                        <Flex vertical gap="small">
                                            <Text>
                                                <Text className="text-red-500 me-1">*</Text>
                                                First Name
                                            </Text>
                                            <TextInput
                                                name="firstName"
                                                isRequired
                                                placeholder="First Name"
                                                type="text"
                                                maxLength={
                                                    nameValidationConfig.maxLength ?? 50
                                                }
                                                handleChange={value => {
                                                    if (value) {
                                                        // Allowed characters come from the
                                                        // supplier's own prebook response (see
                                                        // nameValidationConfig above).
                                                        const sanitizedValue = value.replace(
                                                            nameSanitizerRegex(
                                                                nameValidationConfig
                                                            ),
                                                            ''
                                                        );

                                                        setFieldValue('firstName', sanitizedValue);
                                                        setTimeout(() => {
                                                            validateField('firstName');
                                                        }, 0);
                                                    } else {
                                                        setFieldValue('firstName', '');

                                                        setTimeout(() => {
                                                            validateField('firstName');
                                                        }, 0);
                                                    }
                                                }}
                                            />
                                        </Flex>
                                    </Col>
                                    <Col
                                        className="mt-3 w-full"
                                        md={12} xxl={10}
                                        // onBlur={() => handleFormSubmit(submitForm)}
                                    >
                                        <Flex vertical gap="small">
                                            <Text>
                                                <Text className="text-red-500 me-1">*</Text>
                                                Last Name
                                            </Text>
                                            <TextInput
                                                name="lastName"
                                                isRequired
                                                placeholder="Last Name"
                                                type="text"
                                                maxLength={
                                                    nameValidationConfig.maxLength ?? 50
                                                }
                                                handleChange={value => {
                                                    if (value) {
                                                        // Allowed characters come from the
                                                        // supplier's own prebook response (see
                                                        // nameValidationConfig above).
                                                        const sanitizedValue = value.replace(
                                                            nameSanitizerRegex(
                                                                nameValidationConfig
                                                            ),
                                                            ''
                                                        );

                                                        setFieldValue('lastName', sanitizedValue);
                                                        setTimeout(() => {
                                                            validateField('lastName');
                                                        }, 0);
                                                    } else {
                                                        setFieldValue('lastName', '');

                                                        setTimeout(() => {
                                                            validateField('lastName');
                                                        }, 0);
                                                    }
                                                }}
                                            />
                                        </Flex>
                                    </Col>
                                    <Col
                                        className="w-full"
                                        md={12} xxl={10}
                                        // onBlur={() => handleFormSubmit(submitForm)}
                                    >
                                        <Flex vertical gap="small">
                                            <Text>
                                                <Text className="text-red-500 me-1">*</Text>
                                                Date of Birth
                                            </Text>
                                            <DatePickerInput
                                                placeholder="Select Date"
                                                isRequired
                                                name="dob"
                                                needConfirm={false}
                                                classes="w-full"
                                                maxDate={maxDate}
                                                minDate={minDate}
                                                handleChange={value => {
                                                    if (value) {
                                                        setFieldValue('dob', value);
                                                        setTimeout(() => {
                                                            validateField('dob');
                                                        }, 0);
                                                    } else {
                                                        setFieldValue('dob', '');

                                                        setTimeout(() => {
                                                            validateField('dob');
                                                        }, 0);
                                                    }
                                                }}
                                            />
                                        </Flex>
                                    </Col>
                                    {isPassportRequired && (
                                        <Col className="w-full" md={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    {isPassportRequired && (
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                    )}
                                                    Passport No
                                                </Typography.Text>
                                                <TextInput
                                                    name="passportNo"
                                                    isRequired
                                                    allowAlphabetsAndNumbersOnly
                                                    placeholder="Passport No"
                                                    type="text"
                                                    handleChange={value => {
                                                        if (value) {
                                                            setFieldValue('passportNo', value);
                                                            setTimeout(() => {
                                                                validateField('passportNo');
                                                            }, 0);
                                                        } else {
                                                            setFieldValue('passportNo', '');

                                                            setTimeout(() => {
                                                                validateField('passportNo');
                                                            }, 0);
                                                        }
                                                    }}
                                                />
                                            </Flex>
                                        </Col>
                                    )}

                                    {isPassportRequired && (
                                        <Col className="w-full" md={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    {isPassportRequired && (
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                    )}
                                                    Passport Issue Date
                                                </Typography.Text>
                                                <DatePickerInput
                                                    placeholder="Select Date"
                                                    name="passportIssueDate"
                                                    classes="w-full"
                                                    maxDate={dayjs()}
                                                    isRequired
                                                    needConfirm={false}
                                                    handleChange={value => {
                                                        if (value) {
                                                            setFieldValue(
                                                                'passportIssueDate',
                                                                value
                                                            );
                                                            setTimeout(() => {
                                                                validateField('passportIssueDate');
                                                            }, 0);
                                                        } else {
                                                            setFieldValue('passportIssueDate', '');

                                                            setTimeout(() => {
                                                                validateField('passportIssueDate');
                                                            }, 0);
                                                        }
                                                    }}
                                                />
                                            </Flex>
                                        </Col>
                                    )}

                                    {isPassportRequired && (
                                        <Col className="w-full" md={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    {isPassportRequired && (
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                    )}
                                                    Passport Expiry Date
                                                </Typography.Text>
                                                <DatePickerInput
                                                    placeholder="Select Date"
                                                    name="passportExpDate"
                                                    classes="w-full"
                                                    minDate={dayjs(new Date())}
                                                    isRequired
                                                    needConfirm={false}
                                                    handleChange={value => {
                                                        if (value) {
                                                            setFieldValue('passportExpDate', value);
                                                            setTimeout(() => {
                                                                validateField('passportExpDate');
                                                            }, 0);
                                                        } else {
                                                            setFieldValue('passportExpDate', '');

                                                            setTimeout(() => {
                                                                validateField('passportExpDate');
                                                            }, 0);
                                                        }
                                                    }}
                                                />
                                            </Flex>
                                        </Col>
                                    )}
                                    {isPanRequired && (
                                        <Col className="w-full" md={12} xxl={10}>
                                            <Flex vertical gap="small">
                                                <Typography.Text>
                                                    {isPanRequired && (
                                                        <Typography.Text className="text-red-500 me-1">
                                                            *
                                                        </Typography.Text>
                                                    )}
                                                    PAN
                                                </Typography.Text>
                                                <TextInput
                                                    name="pan"
                                                    isRequired
                                                    allowAlphabetsAndNumbersOnly
                                                    placeholder="PAN"
                                                    type="text"
                                                    allowUpperCaseOnly
                                                    maxLength={10}
                                                    handleChange={value => {
                                                        if (value) {
                                                            setFieldValue('pan', value);
                                                            setTimeout(() => {
                                                                validateField('pan');
                                                            }, 0);
                                                        } else {
                                                            setFieldValue('pan', '');

                                                            setTimeout(() => {
                                                                validateField('pan');
                                                            }, 0);
                                                        }
                                                    }}
                                                />
                                            </Flex>
                                        </Col>
                                    )}

                                    {/* <Col
                                        className="w-full"
                                        md={12} xxl={10}
                                        // onBlur={() => handleFormSubmit(submitForm)}
                                    >
                                        <Flex vertical gap="small">
                                            <Text>
                                                <Text className="text-red-500 me-1">*</Text>
                                                Email ID
                                            </Text>
                                            <TextInput
                                                name="email"
                                                // isRequired
                                                placeholder="Email ID"
                                                type="text"
                                                maxLength={50}
                                            />
                                        </Flex>
                                    </Col> */}
                                    {/* <Col
                                        className="w-full"
                                        md={12} xxl={10}
                                        // onBlur={() => handleFormSubmit(submitForm)}
                                    >
                                        <Flex vertical gap="small">
                                            <Text>
                                                <Text className="text-red-500 me-1">*</Text>
                                                Mobile Number
                                            </Text>
                                            <TextInput
                                                name="phone"
                                                placeholder="Mobile Number"
                                                type="text"
                                                // isRequired
                                                allowNumbersOnly
                                                maxLength={10}
                                                minLength={10}
                                            />
                                        </Flex>
                                    </Col> */}
                                </Row>
                                {shouldShowSaveCheckbox(values) &&
                                    (canSaveMore ? (
                                        <Row className="mt-3">
                                            <Checkbox
                                                checked={false}
                                                disabled={isSavingGuest}
                                                onChange={e => {
                                                    if (e.target.checked) handleSaveGuest(values);
                                                }}
                                            >
                                                Save guest
                                            </Checkbox>
                                        </Row>
                                    ) : (
                                        <Row className="mt-3">
                                            <Text className="text-xs text-gray-500">
                                                You&apos;ve saved the maximum of {savedGuestsLimit}{' '}
                                                guests. Remove one to save another.
                                            </Text>
                                        </Row>
                                    ))}
                            </Form>
                        )}
                    </Formik>
                </Row>
            </Card>
        </Content>
    );
};

export default DetailBookings;
