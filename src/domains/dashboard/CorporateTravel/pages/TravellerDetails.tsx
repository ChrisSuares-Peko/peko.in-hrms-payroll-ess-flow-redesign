import { useEffect, useMemo, useRef, useState } from 'react';

import { DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form as AntForm, Row, Spin, Typography } from 'antd';
import { FieldArray, Form, Formik, getIn, useFormikContext } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { getBasicInfo } from '@domains/dashboard/profile/api/basicInfo';
import { setData as setBasicInfoData } from '@domains/dashboard/profile/slices/basicInfo';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { useGetEmployee } from '../../Airline/hooks/useGetEmployeeApi';
import { getVisaAddresses } from '../api/visa';
import VisaProgressSteps from '../components/VisaProgressSteps';
import {
    useStageVisaDocuments,
    useVisaProductDocumentsForUpload,
    useVisaSearch,
} from '../hooks/useVisaApi';
import { type StagedVisaDocument, type VisaProductDocument } from '../types/visa';
import { type VisaOption } from '../utils/data';

const { Text, Title } = Typography;

const INDIA_STATE_OPTIONS = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
].map(s => ({ label: s, value: s }));

type PassengerType = 'adult' | 'child' | 'infant';

const PASSENGER_LABEL: Record<PassengerType, string> = {
    adult: 'Adult',
    child: 'Child',
    infant: 'Infant',
};

const defaultPassenger = {
    nationality: 'IN',
    firstName: '',
    lastName: '',
    passportNo: '',
    contactNumber: '',
    dob: '',
    documents: {} as Record<string, File | null>,
    _selectedEmployee: '',
};

type PassengerValues = typeof defaultPassenger & { type: PassengerType };

const buildInitialValues = (travellers: { adults: number; children: number; infants: number }) => ({
    passengers: [
        ...Array.from(
            { length: travellers.adults },
            (): PassengerValues => ({ ...defaultPassenger, type: 'adult' })
        ),
        ...Array.from(
            { length: travellers.children },
            (): PassengerValues => ({ ...defaultPassenger, type: 'child' })
        ),
        ...Array.from(
            { length: travellers.infants },
            (): PassengerValues => ({ ...defaultPassenger, type: 'infant' })
        ),
    ],
    companyName: '',
    billingEmail: '',
    phoneNumber: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingState: '',
    billingPincode: '',
});

type FormValues = ReturnType<typeof buildInitialValues>;

const DOC_MESSAGES: Record<string, string> = {
    PASSPORT_FRONT: 'Please upload the passport front',
    PASSPORT_BACK: 'Please upload the passport back',
    PHOTOGRAPH: 'Please upload the photograph',
    AADHAR_CARD: 'Please upload the Aadhar card',
    COVERING_LETTER: 'Please upload the covering letter',
};

const noSpacesOnly = (message: string, fieldName = 'Field') =>
    Yup.string()
        .required(message)
        .test('no-spaces-only', message, value => !!value && value.trim().length > 0)
        .test(
            'no-leading-trailing-spaces',
            `${fieldName} cannot start or end with spaces`,
            value => !value || value === value.trim()
        );

const getAgeInYears = (dob: string): number => {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age;
};

const buildValidationSchema = (
    docCodes: string[],
    visa?: import('./../../CorporateTravel/utils/data').VisaOption | null
) => {
    const docShape =
        docCodes.length > 0
            ? Object.fromEntries(
                  docCodes.map(code => [
                      code,
                      Yup.mixed()
                          .nullable()
                          .required(DOC_MESSAGES[code] ?? 'This document is required'),
                  ])
              )
            : {};

    const dobValidation = Yup.string()
        .required('Please select the date of birth')
        .when('type', {
            is: 'adult',
            then: schema =>
                schema.test(
                    'adult-dob',
                    `Adult must be ${visa?.adultAge?.minAge ?? 18}+ years old`,
                    val => !val || getAgeInYears(val) >= (visa?.adultAge?.minAge ?? 18)
                ),
        })
        .when('type', {
            is: 'child',
            then: schema =>
                visa?.childAge
                    ? schema.test(
                          'child-dob',
                          `Child must be ${visa.childAge.minAge}–${visa.childAge.maxAge} years old`,
                          val => {
                              if (!val) return true;
                              const age = getAgeInYears(val);
                              return (
                                  age >= (visa.childAge?.minAge ?? 0) &&
                                  age < (visa.childAge?.maxAge ?? 99)
                              );
                          }
                      )
                    : schema,
        })
        .when('type', {
            is: 'infant',
            then: schema =>
                visa?.infantAge
                    ? schema.test(
                          'infant-dob',
                          `Infant must be ${visa.infantAge.minAge}–${visa.infantAge.maxAge} years old`,
                          val => {
                              if (!val) return true;
                              const age = getAgeInYears(val);
                              return (
                                  age >= (visa.infantAge?.minAge ?? 0) &&
                                  age < (visa.infantAge?.maxAge ?? 99)
                              );
                          }
                      )
                    : schema,
        });

    const passengerSchema = Yup.object({
        firstName: noSpacesOnly('Please enter the first name', 'First name')
            .min(3, 'First name must be at least 3 characters')
            .max(50, 'First name must not exceed 50 characters'),
        lastName: noSpacesOnly('Please enter the last name', 'Last name')
            .min(2, 'Last name must be at least 2 characters')
            .max(50, 'Last name must not exceed 50 characters'),
        passportNo: noSpacesOnly('Please enter the passport number', 'Passport number')
            .min(6, 'Passport number must be at least 6 characters')
            .max(12, 'Passport number must not exceed 12 characters'),
        contactNumber: Yup.string()
            .required('Please enter the contact number')
            .test(
                'no-spaces-only',
                'Please enter the contact number',
                value => !!value && value.trim().length > 0
            )
            .test(
                'no-leading-trailing-spaces',
                'Contact number cannot start or end with spaces',
                value => !value || value === value.trim()
            )
            .max(10, 'Contact number must not exceed 10 digits')
            .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
        dob: dobValidation,
        documents: Yup.object(docShape),
    });

    return Yup.object({
        passengers: Yup.array()
            .of(passengerSchema)
            .test('unique-passport', 'Duplicate passport numbers', passengers => {
                if (!passengers) return true;
                const seen = new Map<string, number[]>();
                passengers.forEach((p, idx) => {
                    const no = p?.passportNo?.trim().toUpperCase();
                    if (no) {
                        if (!seen.has(no)) seen.set(no, []);
                        seen.get(no)!.push(idx);
                    }
                });
                const errors: Yup.ValidationError[] = [];
                seen.forEach(indices => {
                    if (indices.length > 1) {
                        indices.forEach(idx => {
                            errors.push(
                                new Yup.ValidationError(
                                    'Passport number already used for another traveller',
                                    passengers[idx]?.passportNo,
                                    `passengers[${idx}].passportNo`
                                )
                            );
                        });
                    }
                });
                return errors.length > 0 ? new Yup.ValidationError(errors) : true;
            }),
        companyName: noSpacesOnly('Please enter the Company Name', 'Company name')
            .min(3, 'Company name must be at least 3 characters')
            .max(100, 'Company name must not exceed 100 characters')
            .matches(
                /^[a-zA-Z0-9 \-&]+$/,
                'Please enter a valid company name using letters, numbers, spaces, - and &'
            ),
        billingEmail: Yup.string()
            .required('Please enter the billing email')
            .test(
                'no-spaces-only',
                'Please enter the billing email',
                value => !!value && value.trim().length > 0
            )
            .test(
                'no-leading-trailing-spaces',
                'Billing email cannot start or end with spaces',
                value => !value || value === value.trim()
            )
            .test(
                'valid-email',
                'Please enter a valid email',
                value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
            ),
        phoneNumber: noSpacesOnly('Please enter the phone number', 'Phone number'),
        billingAddressLine1: noSpacesOnly('Please enter Address Line 1', 'Address Line 1')
            .min(3, 'Address Line 1 must be at least 3 characters')
            .max(100, 'Address Line 1 must not exceed 100 characters')
            .test(
                'not-numbers-only',
                'Billing address cannot contain numbers only',
                value => !!value && /[a-zA-Z]/.test(value)
            ),
        billingAddressLine2: Yup.string()
            .test(
                'min-length',
                'Address Line 2 must be at least 2 characters',
                value => !value || value.trim().length >= 2
            )
            .test(
                'max-length',
                'Address Line 2 must not exceed 100 characters',
                value => !value || value.length <= 100
            )
            .test(
                'no-leading-trailing-spaces',
                'Address Line 2 cannot start or end with spaces',
                value => !value || value === value.trim()
            ),
        billingCity: noSpacesOnly('Please enter the City', 'City')
            .min(3, 'City must be at least 3 characters')
            .max(50, 'City must not exceed 50 characters'),
        billingState: noSpacesOnly('Please select the State', 'State'),
        billingPincode: Yup.string()
            .required('Please enter the Pincode')
            .test(
                'no-spaces-only',
                'Please enter the Pincode',
                value => !!value && value.trim().length > 0
            )
            .test(
                'no-leading-trailing-spaces',
                'Pincode cannot start or end with spaces',
                value => !value || value === value.trim()
            )
            .matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    });
};

// ─── Visa-specific file upload matching Figma design ─────────────────────────

const VisaFileUpload = ({
    name,
    label,
    allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize = 5120,
    isRequired = false,
}: {
    name: string;
    label: string;
    allowedFileTypes?: string[];
    maxFileSize?: number;
    isRequired?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const { setFieldValue, touched, errors, setFieldTouched, submitCount, values } =
        useFormikContext<any>();
    const inputRef = useRef<HTMLInputElement>(null);
    const existingFile = getIn(values, name);
    const [fileName, setFileName] = useState<string>(
        existingFile instanceof File ? existingFile.name : ''
    );

    const hasError = (getIn(touched, name) || submitCount > 0) && getIn(errors, name);

    const handleFile = (file: File) => {
        if (!allowedFileTypes.includes(file.type)) {
            dispatch(
                showToast({
                    description: 'Invalid file type. Please upload a valid file.',
                    variant: 'error',
                })
            );
            return;
        }
        if (file.size / 1024 > maxFileSize) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${maxFileSize / 1024} MB`,
                    variant: 'error',
                })
            );
            return;
        }
        setFileName(file.name);
        setFieldValue(name, file);
        setFieldTouched(name, true);
    };

    return (
        <>
            <AntForm.Item
                label={label}
                colon={false}
                required={isRequired}
                validateStatus={hasError ? 'error' : ''}
                help={hasError ? (getIn(errors, name) as string) : undefined}
                style={{ marginBottom: 8 }}
            >
                <div
                    role="button"
                    tabIndex={0}
                    style={{
                        height: 51,
                        background: '#FFFFFF',
                        border: `0.927px dashed ${hasError ? '#ff4d4f' : '#CBD0DC'}`,
                        borderRadius: 10.6,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px 0 20px',
                        cursor: 'pointer',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
                    }}
                >
                    <span
                        style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#8C8C8C',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                        }}
                    >
                        {fileName || 'Upload File'}
                    </span>
                    <button
                        type="button"
                        style={{
                            flexShrink: 0,
                            background: '#FFFFFF',
                            border: '0.867px solid #CBD0DC',
                            borderRadius: 7.4,
                            padding: '6.9px 14.3px',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#54575C',
                            cursor: 'pointer',
                            lineHeight: '16px',
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            inputRef.current?.click();
                        }}
                    >
                        Browse File
                    </button>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept={allowedFileTypes.join(',')}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                    }}
                />
            </AntForm.Item>
            <Flex vertical gap={2} style={{ marginTop: 4, marginBottom: 16 }}>
                <Text style={{ fontSize: 11, color: '#8C8C8C' }}>
                    File Formats Supported: JPG, JPEG, PNG, PDF.
                </Text>
                <Text style={{ fontSize: 11, color: '#8C8C8C' }}>
                    Max. size:{' '}
                    {maxFileSize >= 1024 ? `${maxFileSize / 1024} MB` : `${maxFileSize} KB`}
                </Text>
            </Flex>
        </>
    );
};

const PassengerCard = ({
    index,
    type,
    number,
    expanded,
    onToggle,
    onDelete,
    productDocuments,
    isComplete,
    employeeList,
    generateEmployeesDropdown,
}: {
    index: number;
    type: PassengerType;
    number: number;
    expanded: boolean;
    onToggle: () => void;
    onDelete?: () => void;
    productDocuments: VisaProductDocument[];
    isComplete: boolean;
    employeeList: any[];
    generateEmployeesDropdown: (data: any[]) => any[];
}) => {
    const p = `passengers.${index}`;
    const { setFieldValue } = useFormikContext<FormValues>();
    const label = `${PASSENGER_LABEL[type]} Passenger ${number}`;

    return (
        <div
            style={{
                background: '#FFFFFF',
                boxShadow: '0px 1.55805px 15.5805px 1.43385px rgba(0, 0, 0, 0.06)',
                borderRadius: 32,
                marginBottom: 20,
                overflow: 'hidden',
            }}
        >
            {/* Header — always visible */}
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={e => {
                    if (e.key === 'Enter') onToggle();
                }}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 30px',
                    height: 82,
                    cursor: 'pointer',
                }}
            >
                <Flex align="center" gap={10}>
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: isComplete ? '#43B75D' : '#D9D9D9',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                border: `2px solid ${isComplete ? '#ECFDF3' : '#BFBFBF'}`,
                            }}
                        />
                    </div>
                    <Text style={{ fontWeight: 500, fontSize: 16, color: 'rgba(0,0,0,0.85)' }}>
                        {label}
                    </Text>
                </Flex>
                <Flex align="center" gap={12}>
                    {onDelete && (
                        <DeleteOutlined
                            style={{ fontSize: 15, color: '#FF4F4F', cursor: 'pointer' }}
                            onClick={e => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        />
                    )}
                    <DownOutlined
                        style={{
                            fontSize: 13,
                            color: '#667085',
                            transition: 'transform 0.3s ease',
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                    />
                </Flex>
            </div>

            {/* Expandable content */}
            <div
                style={{
                    maxHeight: expanded ? 2000 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.35s ease',
                }}
            >
                <div style={{ padding: '0 29px 24px' }}>
                    {type === 'adult' && employeeList.length > 0 && (
                        <AntForm layout="vertical" style={{ marginTop: 8, marginBottom: 4 }}>
                            <Row gutter={[20, 0]}>
                                <Col xs={24} sm={12}>
                                    <SelectInputWithSearch
                                        name={`${p}._selectedEmployee`}
                                        label="Select Employee"
                                        placeholder="Select employee"
                                        options={generateEmployeesDropdown(employeeList)}
                                        handleChange={async eid => {
                                            if (!eid) {
                                                await Promise.all([
                                                    setFieldValue(`${p}.firstName`, ''),
                                                    setFieldValue(`${p}.lastName`, ''),
                                                    setFieldValue(`${p}.dob`, ''),
                                                    setFieldValue(`${p}.passportNo`, ''),
                                                    setFieldValue(`${p}.contactNumber`, ''),
                                                ]);
                                                return;
                                            }
                                            const emp = generateEmployeesDropdown(
                                                employeeList
                                            ).find(e => e.value === eid);
                                            if (!emp) return;
                                            const nameParts = emp.fullName.trim().split(' ');
                                            const firstName = nameParts[0] ?? '';
                                            const lastName =
                                                nameParts.length > 1
                                                    ? nameParts.slice(1).join(' ')
                                                    : '';
                                            await Promise.all([
                                                setFieldValue(`${p}.firstName`, firstName),
                                                setFieldValue(`${p}.lastName`, lastName),
                                                setFieldValue(`${p}.dob`, emp.dateOfBirth || ''),
                                                setFieldValue(
                                                    `${p}.passportNo`,
                                                    emp.passportNo || ''
                                                ),
                                                setFieldValue(
                                                    `${p}.contactNumber`,
                                                    emp.mobileNo || ''
                                                ),
                                            ]);
                                        }}
                                    />
                                </Col>
                            </Row>
                        </AntForm>
                    )}
                    <AntForm layout="vertical" style={{ marginTop: 8 }}>
                        <Row gutter={[20, 0]}>
                            <Col xs={24} sm={8}>
                                <TextInput
                                    name={`${p}.firstName`}
                                    label="First Name"
                                    placeholder="Enter first name"
                                    type="text"
                                    allowAlphabetsAndSpaceOnly
                                    maxLength={50}
                                    isRequired
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <TextInput
                                    name={`${p}.lastName`}
                                    label="Last Name"
                                    placeholder="Enter last name"
                                    type="text"
                                    allowAlphabetsAndSpaceOnly
                                    isRequired
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <DatePickerInput
                                    name={`${p}.dob`}
                                    label="Date of Birth"
                                    placeholder="Select date"
                                    isRequired
                                />
                            </Col>
                        </Row>
                        <Row gutter={[21, 0]}>
                            <Col xs={24} sm={8}>
                                <TextInput
                                    name={`${p}.passportNo`}
                                    label="Passport Number"
                                    placeholder="e.g. P1234567"
                                    type="text"
                                    convertToUppercase
                                    allowAlphabetsAndNumbersOnly
                                    isRequired
                                />
                            </Col>
                            <Col xs={24} sm={8}>
                                <TextInput
                                    name={`${p}.contactNumber`}
                                    label="Contact Number"
                                    placeholder="Enter contact number"
                                    type="text"
                                    allowNumbersOnly
                                    maxLength={10}
                                    isRequired
                                />
                            </Col>
                        </Row>
                    </AntForm>

                    {productDocuments.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <Flex align="center" className="mb-4">
                                <Title level={5} style={{ margin: 0, fontWeight: 500 }}>
                                    Travellers documents
                                </Title>
                            </Flex>
                            <AntForm layout="vertical">
                                <Row gutter={[20, 0]}>
                                    {productDocuments.map(doc => (
                                        <Col xs={24} sm={8} key={doc.document_code}>
                                            <VisaFileUpload
                                                name={`${p}.documents.${doc.document_code}`}
                                                label={doc.display_value}
                                                isRequired
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </AntForm>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TravellerDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as {
        visa?: VisaOption;
        travellers?: { adults: number; children: number; infants: number };
        destination?: string;
        destinationId?: number;
        visaType?: string;
        nationality?: string;
        travelDate?: string;
    } | null;

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('visa_traveller_details');
        }
    }, []);

    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(s => s.reducer.auth);
    const basicInfo = useAppSelector(s => s.reducer.basicInfo.data);
    const selectedProduct = useAppSelector(s => s.reducer.visa.selectedProduct);

    const [basicInfoReady, setBasicInfoReady] = useState(!!basicInfo);
    const [defaultAddress, setDefaultAddress] = useState({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const [, addressResp] = await Promise.all([
                basicInfo
                    ? Promise.resolve(null)
                    : getBasicInfo({ userId: id, userType: role }).then(data => {
                          if (data) dispatch(setBasicInfoData({ data }));
                          return data;
                      }),
                getVisaAddresses({ userId: id, userType: role }),
            ]);

            if (addressResp && addressResp.addressDetails) {
                const def =
                    addressResp.addressDetails.find(a => a.default === 1) ??
                    addressResp.addressDetails[0];
                if (def) {
                    setDefaultAddress({
                        addressLine1: def.addressLine1 ?? '',
                        addressLine2: def.addressLine2 ?? '',
                        city: def.city ?? '',
                        state: def.state ?? '',
                        pincode: def.pincode ?? def.zipCode ?? '',
                    });
                }
            }
            setBasicInfoReady(true);
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const visa = state?.visa ?? null;
    const travellers = state?.travellers ?? { adults: 1, children: 0, infants: 0 };

    const [actualCounts, setActualCounts] = useState({
        adult: travellers.adults,
        child: travellers.children,
        infant: travellers.infants,
    });

    const { visaOptions: freshVisaOptions } = useVisaSearch({
        adult: actualCounts.adult,
        child: actualCounts.child,
        infant: actualCounts.infant,
        destination: state?.destinationId,
        travelDate: state?.travelDate,
        category: state?.visaType,
    });

    const freshVisa = freshVisaOptions.find(v => v.productId === visa?.productId) ?? visa;

    const initialValues: FormValues = {
        ...buildInitialValues(travellers),
        companyName: basicInfo?.companyName || basicInfo?.name || '',
        billingEmail: basicInfo?.email ?? '',
        phoneNumber: basicInfo?.mobileNo ?? '',
        billingAddressLine1: defaultAddress.addressLine1,
        billingAddressLine2: defaultAddress.addressLine2,
        billingCity: defaultAddress.city,
        billingState: defaultAddress.state,
        billingPincode: defaultAddress.pincode,
    };

    const [expandedIndex, setExpandedIndex] = useState(0);

    const { documents: productDocuments } = useVisaProductDocumentsForUpload(
        visa?.productId ?? null
    );

    const validationSchema = useMemo(
        () =>
            buildValidationSchema(
                productDocuments.map(d => d.document_code),
                visa
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [productDocuments.map(d => d.document_code).join(','), visa?.productId]
    );

    const { data: employeeList, generateEmployeesDropdown } = useGetEmployee();
    const { stageDocuments, isLoading: isSubmitting } = useStageVisaDocuments();

    const handleProceed = async (values: FormValues) => {
        // Use actual passenger counts from the form (may differ from initial selection if travellers were added/deleted)
        const actualAdults = values.passengers.filter(p => p.type === 'adult').length;
        const actualChildren = values.passengers.filter(p => p.type === 'child').length;
        const actualInfants = values.passengers.filter(p => p.type === 'infant').length;
        const actualTotal = actualAdults + actualChildren + actualInfants;

        // Documents are uploaded to storage now; the vendor order (and document
        // submission to the vendor) only happens at payment time.
        const stagedPerPassenger = await Promise.all(
            values.passengers.map(p => stageDocuments(p.documents))
        );
        if (stagedPerPassenger.some(r => r === false)) return;

        navigate(
            `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaPayment}`,
            {
                state: {
                    ...location.state,
                    travelDate: state?.travelDate ?? new Date().toISOString().split('T')[0],
                    visaBaseAmount: (freshVisa?.pricePerPerson ?? 0) * actualTotal,
                    productBreakup: selectedProduct
                        ? {
                              breakup: selectedProduct.breakup,
                              age_cost_breakup: selectedProduct.age_cost_breakup,
                          }
                        : undefined,
                    companyName: values.companyName,
                    billingEmail: values.billingEmail,
                    phoneNumber: values.phoneNumber,
                    billingAddressLine1: values.billingAddressLine1,
                    billingAddressLine2: values.billingAddressLine2,
                    billingCity: values.billingCity,
                    billingState: values.billingState,
                    billingPincode: values.billingPincode,
                    passengers: values.passengers.map((p, idx) => ({
                        firstName: p.firstName,
                        lastName: p.lastName,
                        passportNo: p.passportNo,
                        dob: p.dob,
                        type: p.type,
                        contactNumber: p.contactNumber,
                        stagedDocuments: stagedPerPassenger[idx] as StagedVisaDocument[],
                    })),
                },
            }
        );
    };

    if (!basicInfoReady) {
        return (
            <Flex justify="center" align="center" className="py-16">
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={20} className="w-full max-w-5xl mx-auto pb-10">
            <VisaProgressSteps currentStep={1} />

            {visa && (
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 24,
                        boxShadow: '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                    }}
                    styles={{ body: { padding: '16px 24px' } }}
                >
                    <Flex align="center" gap={16}>
                        <Flex
                            vertical
                            align="center"
                            justify="center"
                            className="w-16 h-16 rounded-xl bg-red-50 shrink-0"
                        >
                            <Text className="text-2xl font-bold text-[#FF4F4F] leading-none">
                                {visa.days}
                            </Text>
                            <Text className="text-[10px] text-[#FF4F4F]">Days</Text>
                        </Flex>
                        <Flex vertical>
                            <Text className="font-semibold text-base">{visa.name}</Text>
                            <Text className="text-xs text-gray-400">
                                {visa.entryType} · {visa.processingTime}
                            </Text>
                        </Flex>
                    </Flex>
                </Card>
            )}

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={handleProceed as any}
            >
                {({ values, setTouched, touched, validateForm }) => {
                    const typeCounters: Record<PassengerType, number> = {
                        adult: 0,
                        child: 0,
                        infant: 0,
                    };
                    const passengerFields = {
                        firstName: true,
                        lastName: true,
                        dob: true,
                        passportNo: true,
                        contactNumber: true,
                    };
                    const touchPassenger = (index: number) => {
                        const existingPassengers = Array.isArray((touched as any).passengers)
                            ? [...(touched as any).passengers]
                            : [];
                        existingPassengers[index] = passengerFields;
                        setTouched({ ...(touched as any), passengers: existingPassengers });
                    };
                    const touchAllAndExpand = async () => {
                        const allTouched = values.passengers.map(() => passengerFields);
                        await setTouched({ ...(touched as any), passengers: allTouched });
                        const errors = await validateForm();
                        const passengerErrors = (errors as any).passengers as any[];
                        if (Array.isArray(passengerErrors)) {
                            const firstErrIdx = passengerErrors.findIndex(
                                e => e && Object.keys(e).length > 0
                            );
                            if (firstErrIdx >= 0) setExpandedIndex(firstErrIdx);
                        }
                    };
                    return (
                        <Form>
                            <FieldArray name="passengers">
                                {({ push, remove }) => (
                                    <>
                                        {values.passengers.map((passenger, index) => {
                                            typeCounters[passenger.type] += 1;
                                            const passengerComplete =
                                                passenger.firstName.trim().length >= 3 &&
                                                passenger.lastName.trim().length >= 2 &&
                                                passenger.passportNo.trim().length >= 6 &&
                                                /^[6-9]\d{9}$/.test(
                                                    passenger.contactNumber.trim()
                                                ) &&
                                                !!passenger.dob &&
                                                productDocuments.every(
                                                    doc =>
                                                        passenger.documents[
                                                            doc.document_code
                                                        ] instanceof File
                                                );
                                            return (
                                                <PassengerCard
                                                    key={index}
                                                    index={index}
                                                    type={passenger.type}
                                                    number={typeCounters[passenger.type]}
                                                    expanded={expandedIndex === index}
                                                    isComplete={passengerComplete}
                                                    onToggle={() =>
                                                        setExpandedIndex(
                                                            expandedIndex === index ? -1 : index
                                                        )
                                                    }
                                                    onDelete={
                                                        index > 0
                                                            ? () => {
                                                                  const removed =
                                                                      values.passengers[index];
                                                                  remove(index);
                                                                  setActualCounts(prev => ({
                                                                      ...prev,
                                                                      adult:
                                                                          removed.type === 'adult'
                                                                              ? Math.max(
                                                                                    0,
                                                                                    prev.adult - 1
                                                                                )
                                                                              : prev.adult,
                                                                      child:
                                                                          removed.type === 'child'
                                                                              ? Math.max(
                                                                                    0,
                                                                                    prev.child - 1
                                                                                )
                                                                              : prev.child,
                                                                      infant:
                                                                          removed.type === 'infant'
                                                                              ? Math.max(
                                                                                    0,
                                                                                    prev.infant - 1
                                                                                )
                                                                              : prev.infant,
                                                                  }));
                                                                  setExpandedIndex(prev => {
                                                                      if (prev === index) return 0;
                                                                      if (prev > index)
                                                                          return prev - 1;
                                                                      return prev;
                                                                  });
                                                              }
                                                            : undefined
                                                    }
                                                    productDocuments={productDocuments}
                                                    employeeList={employeeList}
                                                    generateEmployeesDropdown={
                                                        generateEmployeesDropdown
                                                    }
                                                />
                                            );
                                        })}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                marginBottom: 20,
                                            }}
                                        >
                                            <Button
                                                type="default"
                                                icon={<PlusOutlined />}
                                                style={{
                                                    width: 208,
                                                    height: 40,
                                                    borderRadius: 8,
                                                    borderColor: '#FF4F4F',
                                                    color: '#FF4F4F',
                                                }}
                                                onClick={() => {
                                                    touchPassenger(expandedIndex);
                                                    push({ ...defaultPassenger, type: 'adult' });
                                                    setActualCounts(prev => ({
                                                        ...prev,
                                                        adult: prev.adult + 1,
                                                    }));
                                                    setExpandedIndex(values.passengers.length);
                                                }}
                                            >
                                                Add another customer
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </FieldArray>

                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 24,
                                    boxShadow:
                                        '0px 1.23646px 12.3646px 1.1379px rgba(0, 0, 0, 0.06)',
                                }}
                                styles={{ body: { padding: '28px 29px 4px' } }}
                            >
                                <Title level={5} style={{ marginBottom: 24, fontWeight: 500 }}>
                                    Billing Details
                                </Title>
                                <AntForm layout="vertical">
                                    <Row gutter={[21, 0]}>
                                        <Col xs={24} sm={8}>
                                            <TextInput
                                                name="companyName"
                                                label="Company Name"
                                                placeholder="Eg. Peko Payments"
                                                type="text"
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <TextInput
                                                name="billingEmail"
                                                label="Billing Email"
                                                placeholder="Eg. billing@company.com"
                                                type="text"
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <TextInput
                                                name="phoneNumber"
                                                label="Phone Number"
                                                placeholder="Eg. 9876543210"
                                                type="text"
                                                allowNumbersOnly
                                                maxLength={10}
                                                isRequired
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutter={[21, 0]}>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="billingAddressLine1"
                                                label="Address Line 1"
                                                placeholder="Eg. 123, Street Name"
                                                type="text"
                                                allowAddressFormat
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name="billingAddressLine2"
                                                label="Address Line 2"
                                                placeholder="Eg. Apt 4B, Building Name"
                                                type="text"
                                                allowAddressFormat
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutter={[21, 0]}>
                                        <Col xs={24} sm={8}>
                                            <TextInput
                                                name="billingCity"
                                                label="City"
                                                placeholder="Eg. Mumbai"
                                                type="text"
                                                allowAlphabetsAndSpaceOnly
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <SelectInput
                                                name="billingState"
                                                label="State"
                                                placeholder="Select state"
                                                options={INDIA_STATE_OPTIONS}
                                                isRequired
                                                showSearch
                                                filterOption={(input, option) =>
                                                    String(option?.children ?? '')
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <TextInput
                                                name="billingPincode"
                                                label="Pincode"
                                                placeholder="Eg. 400001"
                                                type="text"
                                                allowNumbersOnly
                                                maxLength={6}
                                                isRequired
                                            />
                                        </Col>
                                    </Row>
                                </AntForm>
                            </Card>

                            <Flex justify="flex-end" gap={12} className="pt-5" wrap="wrap">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={isSubmitting}
                                    style={{ backgroundColor: '#FF4F4F', borderColor: '#FF4F4F' }}
                                    className="w-full sm:w-auto"
                                    onClick={touchAllAndExpand}
                                >
                                    {isSubmitting ? 'Uploading documents...' : 'Proceed to Payment'}
                                </Button>
                                <Button
                                    size="large"
                                    onClick={() =>
                                        navigate(
                                            `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.results}`,
                                            {
                                                state: {
                                                    ...state,
                                                    travellers: state?.travellers,
                                                },
                                            }
                                        )
                                    }
                                    style={{ borderColor: '#FF4F4F', color: '#FF4F4F' }}
                                    className="w-full sm:w-auto"
                                >
                                    Go back
                                </Button>
                            </Flex>
                        </Form>
                    );
                }}
            </Formik>
        </Flex>
    );
};

export default TravellerDetails;
