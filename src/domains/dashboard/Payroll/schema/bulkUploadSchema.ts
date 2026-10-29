import * as Yup from 'yup';

export const bulkUploadSchema = Yup.object().shape({
    fullName: Yup.string()
        .required('Please enter full name of the employee')
        .min(3, 'Name must be at least 3 characters'),

    dateOfBirth: Yup.date().required('Please enter date of birth of the employee').nullable(),

    gender: Yup.string().required('Please select gender of the employee'),

    mobileNo: Yup.string()
        .matches(/^\d{10}$/, 'Mobile number must contain exactly 10 digits')
        .required('Please enter mobile number of the employee'),

    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Please enter personal email of the employee'),

    // India-payroll-only template — no Country field; State is always required.
    state: Yup.string().required('State is required'),

    addressLine1: Yup.string().required('Please enter address line 1'),

    addressLine2: Yup.string().required('Please enter address line 2'),

    pinCode: Yup.string()
        .matches(/^\d{6}$/, 'Pin code must contain exactly 6 digits')
        .required('Please enter pin code'),

    emergencyContactNumber: Yup.string()
        .nullable()
        .matches(/^\d{10}$/, { message: 'Mobile number must contain exactly 10 digits', excludeEmptyString: true })
        .optional(),

    emergencyContactName: Yup.string().nullable().optional(),

    emergencyContactRelation: Yup.string().nullable().optional(),

    employeeId: Yup.string()
    .min(4, 'Employee ID must be at least 4 characters')
    .required('Please enter employee ID'),

    department: Yup.string().nullable(),

    dateOfJoin: Yup.date().required('Please enter joining date').nullable(),

    designation: Yup.string().required('Please enter designation'),

    workEmailId: Yup.string()
        .email('Please enter a valid work email')
        .optional(),

    contractType: Yup.string().required('Please select the job type'),

    reportingStaff: Yup.string().nullable(),

    timeSchedule: Yup.string().required('Please enter work schedule'),

    probationPeriod: Yup.number()
        .typeError('Please select the probation period')
        .min(0)
        .max(12)
        .required('Please select the probation period'),

    workingDays: Yup.number()
        .transform(value => (Number.isNaN(value) ? undefined : Number(value)))
        .required('Please enter working days')
        .min(1, 'Minimum working days is 1')
        .max(31, 'Maximum working days is 31'),

    pan: Yup.string()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'PAN must be in the format ABCDE1234F')
        .required('PAN is required — without it, TDS is deducted at the higher Section 206AA rate'),

    // Accepts the sheet's short 'New'/'Old' (backend normalizes to the canonical
    // 'New Tax Regime'/'Old Tax Regime' before storage) as well as the long form for
    // backward compatibility with rows edited before this change.
    taxRegime: Yup.string()
        .nullable()
        .oneOf(['', 'New', 'Old', 'New Tax Regime', 'Old Tax Regime'], 'Tax Regime must be New or Old')
        .optional(),

    uan: Yup.string()
        .nullable()
        .matches(/^\d{12}$/, { message: 'UAN must contain exactly 12 digits', excludeEmptyString: true })
        .optional(),

    esiNumber: Yup.string()
        .nullable()
        .matches(/^\d{10}$/, { message: 'ESI Number must contain exactly 10 digits', excludeEmptyString: true })
        .optional(),

    workState: Yup.string().nullable().optional(),

    annualCTC: Yup.number()
        .transform(value => (Number.isNaN(value) ? undefined : Number(value)))
        .required('Please enter Annual CTC')
        .positive('Annual CTC must be greater than 0'),

    accountHolderName: Yup.string().nullable().optional(),

    accountNumber: Yup.string()
        .nullable()
        .matches(/^\d{9,18}$/, { message: 'Account number must contain 9–18 digits', excludeEmptyString: true })
        .optional(),

    bankName: Yup.string().nullable().optional(),

    ifscCode: Yup.string()
        .nullable()
        .transform(value => (value ? value.replace(/\s+/g, '').toUpperCase() : value))
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Please enter a valid IFSC code', excludeEmptyString: true })
        .optional(),

    validated: Yup.boolean().optional(),
    errors: Yup.array().optional(),
});
