import dayjs from 'dayjs';
import moment from 'moment';
import * as Yup from 'yup';

import { ibanRegex } from '@utils/regex';

const noStartSpace = /^[^\s].*$/;
const noEndSpace = /^.*[^\s]$/;
const noConsecutiveSpaces = /^(?!.*\s{2,}).*$/;

const noExtraSpacesValidation = (fieldName: string) =>
    Yup.string()
        .test(
            'no-leading-space',
            `${fieldName} cannot start with a whitespace`,
            value => !value || !/^\s/.test(value)
        )
        .test(
            'no-trailing-space',
            `${fieldName} cannot end with a whitespace`,
            value => !value || !/\s$/.test(value)
        )
        .test(
            'no-consecutive-spaces',
            `${fieldName} cannot contain consecutive whitespaces`,
            value => !value || !/\s{2,}/.test(value)
        );

const scheduleValidation = Yup.string()
    .required('Please select the work schedule of the employee')
    .test(
        'is-valid-schedule',
        'Please enter a valid time schedule',
        (value: string | undefined) => {
            if (!value) return false;

            const [startTime, endTime] = value.split(' - ');

            const start = moment(startTime, 'h:mm A');
            const end = moment(endTime, 'h:mm A');

            return end.isAfter(start);
        }
    );
export default scheduleValidation;

export const employeePersonalSchema = Yup.object().shape({
    fullName: noExtraSpacesValidation('Full name')
        .min(3, 'Full name must be at least 3 characters')
        .required('Please enter full name of the employee'),

    dateOfBirth: Yup.date().nullable().required('Please select date of birth of the employee'),

    gender: Yup.string().required('Please select gender of the employee'),

    mobileNo: Yup.string()
        .min(10, 'Mobile number must be at least 10 digits')
        .required('Please enter mobile number of the employee')
        .test(
            'not-all-zero',
            'Mobile number cannot be all zeros',
            value => !/^(0)+$/.test(value || '')
        ),

    email: Yup.string()
        .required('Please enter email ID of the employee')
        .email('Please enter a valid email ID of the employee')
        .test(
            'no-leading-special-characters',
            'Email addresses cannot start with a special character',
            value => !value || /^[a-zA-Z0-9]/.test(value)
        )
        .test('valid-domain', 'Please enter a valid email ID of the employee', value => {
            if (value) {
                const domainPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return domainPattern.test(value);
            }
            return true;
        }),

    state: Yup.string().when('country', {
        is: (val: string) => val?.toUpperCase() === 'INDIA',
        then: schema => schema.required('Please enter state of the employee'),
        otherwise: schema => schema,
    }),

    country: Yup.string().required('Please enter country of the employee'),

    addressLine1: noExtraSpacesValidation('Address line')
        .min(3, 'Address line must be at least 3 characters')
        .required('Please enter the address line 1 of the employee'),

    addressLine2: noExtraSpacesValidation('Address Line')
        .min(3, 'Address line must be at least 3 characters')
        .required('Please enter the address line 2 of the employee')
        .test(
            'not-same-as-address1',
            'Address Line 2 must be different from Address Line 1',
            function validateAddressLine2(value) {
                const { addressLine1 } = this.parent;
                if (!value || !addressLine1) return true;
                return value.trim() !== addressLine1.trim();
            }
        ),
    pinCode: Yup.string()
        .matches(/^[0-9]{4,10}$/, 'PIN Code must be 6 digits')
        .required('Please enter the PIN Code of the employee'),

    emergencyContactNo: Yup.string()
        .min(10, 'Emergency contact number must be at least 10 characters')
        .test(
            'not-same-as-mobile',
            'Emergency contact number cannot be same as mobile number',
            function verifyNumber(value) {
                const { mobileNo } = this.parent;
                if (!value || !mobileNo) return true; // allow empty / incomplete
                return value !== mobileNo;
            }
        ),

    emergencyContactName: noExtraSpacesValidation('Emergency Contact Name').min(
        3,
        'Emergency Contact Name must be at least 3 characters'
    ),

    emergencyContactRelation: noExtraSpacesValidation('Emergency Contact Relation').min(
        3,
        'Emergency Contact Relation must be at least 3 characters'
    ),
    // Passport Number field disabled on the Add Employee > Personal Information tab.
    // passportNo: Yup.string()
    //     .optional()
    //     .matches(/^[A-Z0-9]*$/, 'No special characters or spaces are allowed.')
    //     .min(6, 'Passport number must be at least 6 characters long')
    //     .max(10, 'Passport number cannot be more than 10 characters long'),
    // passportIssuedCountry: Yup.string().when('passportNo', {
    //     is: (val: string) => !!val,
    //     then: schema => schema.required('Please select passport issuing country'),
    //     otherwise: schema => schema.optional(),
    // }),
    // passportIssuedDate: Yup.string().when('passportNo', {
    //     is: (val: string) => !!val,
    //     then: schema =>
    //         schema
    //             .required('Please select passport issued date')
    //             .test('is-past-date', 'Issued date must be in the past', value =>
    //                 !value || dayjs(value).isBefore(dayjs())
    //             ),
    //     otherwise: schema => schema.optional(),
    // }),
    // passportExpiryDate: Yup.string().when('passportNo', {
    //     is: (val: string) => !!val,
    //     then: schema =>
    //         schema
    //             .required('Please select passport expiry date')
    //             .test('is-future-date', 'Expiry date must be in the future', value =>
    //                 !value || dayjs(value).isAfter(dayjs())
    //             ),
    //     otherwise: schema => schema.optional(),
    // }),
    isDiffrentlyAbled: Yup.boolean(),
});

export const editPersonalSchema = Yup.object().shape({
    fullName: Yup.string()
        .matches(noStartSpace, 'Full name cannot start with whitespace')
        .matches(noEndSpace, 'Full name cannot end with whitespace')
        .matches(noConsecutiveSpaces, 'Full name cannot contain consecutive whitespaces')
        .min(3, 'Name must be at least 3 characters')
        .required('Please enter full name of the employee'),
    dateOfBirth: Yup.date().required('Please enter date of birth of the employee').nullable(),
    gender: Yup.string().required('Please select gender of the employee'),
    mobileNo: Yup.string()
        .min(10, 'Mobile number must be at least 10 characters')
        .required('Please enter mobile number of the employee'),

    personalEmail: Yup.string()
        .email('Please enter valid email address of the employee')
        .required('Please enter official email ID of the employee'),
    email: Yup.string()
        .email('Please enter valid email address of the employee')
        .required('Please enter personal email ID of the employee'),
    emergencyContactNo: Yup.string()
        .min(10, 'Mobile number must be at least 10 characters')
        .notOneOf(
            [Yup.ref('mobileNo')],
            'Emergency contact number cannot be the same as mobile number'
        ),
    emergencyContactName: Yup.string()
        .matches(noStartSpace, 'Emergency contact name cannot start with whitespace')
        .matches(noEndSpace, 'Emergency contact name cannot end with whitespace')
        .matches(
            noConsecutiveSpaces,
            'Emergency contact name cannot contain consecutive whitespaces'
        )
        .min(3, 'Name must be at least 3 characters'),
    emergencyContactRelation: Yup.string()
        .matches(noStartSpace, 'Emergency contact relation cannot start with whitespace')
        .matches(noEndSpace, 'Emergency contact relation cannot end with whitespace')
        .matches(
            noConsecutiveSpaces,
            'Emergency contact relation cannot contain consecutive whitespaces'
        )
        .min(3, 'Relation type must be at least 3 characters'),

    country: Yup.string().required('Please select nationality of the employee'),
    state: Yup.string().when('country', {
        is: (val: string) => val?.toUpperCase() === 'INDIA',
        then: schema => schema.required('Please enter state of the employee'),
        otherwise: schema => schema,
    }),
    qualification: Yup.string(),
    addressLine1: Yup.string()
        .matches(noStartSpace, 'Address line 1 cannot start with whitespace')
        .matches(noEndSpace, 'Address line 1 cannot end with whitespace')
        .matches(noConsecutiveSpaces, 'Address line 1 cannot contain consecutive whitespaces')
        .required('Please enter address line 1'),
    addressLine2: Yup.string()
        .matches(noStartSpace, 'Address line 2 cannot start with whitespace')
        .matches(noEndSpace, 'Address line 2 cannot end with whitespace')
        .matches(noConsecutiveSpaces, 'Address line 2 cannot contain consecutive whitespaces'),

    experience: Yup.string(),
    passportNo: Yup.string()
        .optional()
        .matches(/^[A-Z0-9]*$/, 'No special characters or spaces are allowed.')
        .min(6, 'Passport number must be at least 6 characters long')
        .max(10, 'Passport number cannot be more than 10 characters long'),
    passportIssuedCountry: Yup.string().when('passportNo', {
        is: (val: string) => !!val,
        then: schema => schema.required('Please select passport issuing country'),
        otherwise: schema => schema.optional(),
    }),
    passportIssuedDate: Yup.string().when('passportNo', {
        is: (val: string) => !!val,
        then: schema =>
            schema
                .required('Please select passport issued date')
                .test('is-past-date', 'Issued date must be in the past', value =>
                    !value || dayjs(value).isBefore(dayjs())
                ),
        otherwise: schema => schema.optional(),
    }),
    passportExpiryDate: Yup.string().when('passportNo', {
        is: (val: string) => !!val,
        then: schema =>
            schema
                .required('Please select passport expiry date')
                .test('is-future-date', 'Expiry date must be in the future', value =>
                    !value || dayjs(value).isAfter(dayjs())
                ),
        otherwise: schema => schema.optional(),
    }),
    maritialStatus: Yup.string(),
});

export const employeeSchema = Yup.object().shape({
    dateOfJoin: Yup.date().nullable().required('Please enter date of joining of the employee'),

    employeeId: Yup.string()
        .matches(/^[^\s].*$/, 'Employee ID cannot start with a space')
        .min(4, 'Employee ID must be at least 4 characters')
        .required('Please enter the employee ID of the employee'),

    department: Yup.string().optional(),

    probationPeriod: Yup.number()
        .typeError('Please select the probation period of the employee')
        .min(0)
        .max(12)
        .required('Please select the probation period of the employee'),

    contractType: Yup.string().required('Please select the contract type of the employee'),

    workingHours: Yup.number()
        .min(1, 'Working hours should be at least 1')
        .max(20, 'Working hours should be at most 20')
        .required('Please enter working hours of the employee'),

    designation: Yup.string()
        .matches(/^[^\s].*$/, 'Designation cannot start with a space')
        .min(3, 'Designation must be at least 3 characters')
        .required('Please enter designation of the employee'),

    timeSchedule: scheduleValidation,

    reportingStaff: Yup.string().nullable().optional(),

    workEmailId: Yup.string().email('Please enter a valid email').optional(),
});
export const otherConfigurationsSchema = Yup.object().shape({
    enableEPF: Yup.boolean(),
    epfUAN: Yup.string()
        .nullable()
        .when('enableEPF', {
            is: (enableEPF: boolean) => enableEPF === true,
            then: schema =>
                schema
                    .matches(/^[a-zA-Z0-9]+$/, 'EPF UAN should only contain alphabets and numbers')
                    .length(12, 'EPF UAN must be exactly 12 characters long')
                    .required('Please enter EPF UAN'),
            otherwise: schema => schema,
        }),

    enableESI: Yup.boolean(),
    esiNumber: Yup.string()
        .nullable()
        .when('enableESI', {
            is: (enableESI: boolean) => enableESI === true,
            then: schema =>
                schema
                    .matches(
                        /^[a-zA-Z0-9]+$/,
                        'ESIC IP Number should only contain alphabets and numbers'
                    )
                    .min(10, 'ESIC IP Number must be at least 10 characters long')
                    .required('Please enter ESIC IP Number'),
            otherwise: schema => schema,
        }),

    professionalTax: Yup.boolean(),

    laborWelfareFund: Yup.boolean(),

    tds: Yup.boolean(),
    tdsRegime: Yup.string()
        .nullable()
        .when('tds', {
            is: (tds: boolean) => tds === true,
            then: schema =>
                schema
                    .oneOf(['OLDTAXREGIME', 'NEWTAXREGIME'], 'Please select a valid tax regime')
                    .required('Please select tax regime'),
            otherwise: schema => schema,
        }),
});

export const editEmployeeSchema = Yup.object().shape({
    dateOfJoin: Yup.date().required('Please enter joining date of the employee').nullable(),
    department: Yup.string().optional(),
    contractType: Yup.string().required('Please select contract type for the employee'),
    reportingStaff: Yup.string().nullable(),
    employeeId: Yup.string()
        .min(4, 'Employee ID must be at least 4 characters')
    
        .required('Please enter an employee ID'),

    designation: Yup.string()
        .required('Please enter the designation of the employee')
        .min(3, 'Designation must be at least 3 characters ')
        .matches(/^[^\s].*$/, 'Designation cannot start with a space'),
    timeSchedule: Yup.string()
        .required('Please select the work schedule of the employee')
        .test('is-valid-schedule', 'Invalid schedule format', (value: string | undefined) => {
            if (!value) return false;

            const [startTime, endTime] = value.split(' - ');

            const start = moment(startTime, 'h:mm A');
            const end = moment(endTime, 'h:mm A');

            return end.isAfter(start);
        }),
});

export const editSalaryEmployeeSchema = (salaryFields: any[] = []) =>
    Yup.object().shape(
        salaryFields.reduce((shape: Record<string, any>, field: any) => {
            let validator = Yup.number()
                .typeError(`${field.label} must be a number`)
                .min(0, `${field.label} cannot be negative`);

            if (field.isRequired) {
                validator = validator.required(`Please enter ${field.label.toLowerCase()} of the employee`);
            }

            shape[field.name] = validator;
            return shape;
        }, {})
    );

export const salarySchema = Yup.object().shape({
    basicPay: Yup.number().required('Please enter basic pay of the employee'),
    homeAllowances: Yup.number().required('Please enter home allowances of the employee'),
    travelAllowances: Yup.number().required('Please enter travel allowances of the employee'),
    medicalAllowances: Yup.number().required('Please enter medical allowances of the employee'),
});

export const bankSchema = Yup.object().shape({
    accountName: Yup.string()
        .required('Please enter the account holder name')
        .test(
            'no-start-space',
            'Account holder name cannot start with whitespace',
            value => !value || !/^\s/.test(value)
        )
        .test(
            'no-end-space',
            'Account holder name cannot end with whitespace',
            value => !value || !/\s$/.test(value)
        )
        .test(
            'no-consecutive-spaces',
            'Account holder name cannot contain consecutive whitespaces',
            value => !value || !/\s{2,}/.test(value)
        )
        .min(3, 'Account holder name must be at least 3 characters'),

    accountNumber: Yup.string()
        .required('Please enter the account number')
        .min(15, 'Account number must be at least 15 characters')
        .max(16, 'Account number cannot be more than 16 characters'),

    bankName: Yup.string()
        .required('Please enter the bank name')
        .test(
            'no-start-space',
            'Bank name cannot start with whitespace',
            value => !value || !/^\s/.test(value)
        )
        .test(
            'no-end-space',
            'Bank name cannot end with whitespace',
            value => !value || !/\s$/.test(value)
        )
        .test(
            'no-consecutive-spaces',
            'Bank name cannot contain consecutive whitespaces',
            value => !value || !/\s{2,}/.test(value)
        )
        .min(3, 'Bank name must be at least 3 characters'),

    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .matches(/^[A-Za-z]{4}\d{7}$/, 'Please enter a valid IFSC code'),
});

export const editBankSchema = Yup.object().shape({
    beneficiaryName: Yup.string()
        .required('Pleaase enter  name of the employee')
        .matches(/^[^\s].*$/, 'Beneficiary name cannot start with a space')

        .min(3, 'Beneficiary name must be atleast 3 characters')
        .nullable(),
    accountNumber: Yup.string()
        .required('Please enter account number of the employee ')
        .min(15, 'Account number must be atleast 15 characters'),
    bankName: Yup.string()
        .required('Please enter bank name of the employee')
        .matches(/^[^\s].*$/, 'Bank name cannot start with a space')

        .min(3, 'Bank name must be atleast 3 characters'),
    swiftCode: Yup.string()
        .nullable()
        .matches(
            /^[a-zA-Z0-9]{5,}$/,
            'Swift Code must be at least 5 characters long and contain only letters and numbers'
        ),
    ibanNumber: Yup.string()
        .required('Please enter 23 digit IBAN number of the employee starting with AE')
        .matches(ibanRegex, 'Please enter a valid IBAN starting with AE'),
    routingCode: Yup.string()
        .matches(/^[a-zA-Z0-9]{9,10}$/, 'Routing code must be 9 to 10 characters')
        .nullable(),
});

export const offBoardSchema = Yup.object().shape({
    lastWorkingDay: Yup.string().required('Please last working day of the employee'),
    noticePeriod: Yup.string().required('Please notice period of the employee'),
    offBoardingType: Yup.string().required('Please off boarding type of the employee'),
    reasonForOffBoarding: Yup.string()
        .required('Please enter reason for off boarding')
        .matches(/^[^\s].*$/, 'Reason cannot start with a space')

        .min(3, 'Reason of resignation must be at least 3 characters'),
});

export const profileImageSchema = Yup.object().shape({
    profileImage: Yup.string().required('Please provide profile image'),
});

export const essInviteSchema = Yup.object().shape({
    name: noExtraSpacesValidation('Name')
        .min(3, 'Name must be at least 3 characters')
        .required('Please enter the employee name'),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID'),
    mobileNo: Yup.string()
        .min(10, 'Mobile number must be 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .matches(/^\d+$/, 'Please enter a valid mobile number')
        .required('Please enter the mobile number'),
});
