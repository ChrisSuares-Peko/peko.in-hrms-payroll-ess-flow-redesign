import * as Yup from 'yup';

const noExtraSpacesRegex = /^(?!\s)(?!.*\s{2,})(?!.*\s$).+$/;

export const CompayDetailsSchema = Yup.object().shape({
    companyName: Yup.string()
        .required('Please enter the company name')
        .test(
            'no-leading-trailing-space',
            'Company name cannot start or end with blank space.',
            value => {
                if (!value) return true;
                return value.trim() === value;
            }
        )
        .test(
            'no-consecutive-spaces',
            'Company name cannot contain consecutive blank spaces.',
            value => {
                if (!value) return true;
                return !/\s{2,}/.test(value);
            }
        )
        .matches(
            /^[A-Za-z0-9&.\s-]+$/,
            'Please enter a valid company name using letters, numbers, spaces, - . and &'
        )
        .min(3, 'Company name must be at least 3 characters long'),

    companyAddressLine1: Yup.string()
        .required('Please enter the company address line 1')
        // Leading space check
        .test(
            'no-leading-space',
            'Company address line 1 cannot start with a whitespace.',
            value => {
                if (!value) return true;
                return value.trimStart() === value; // only removes leading spaces
            }
        )
        // Trailing space check
        .test(
            'no-trailing-space',
            'Company address line 1 cannot end with a whitespace.',
            value => {
                if (!value) return true;
                return value.trimEnd() === value; // only removes trailing spaces
            }
        )
        // Consecutive spaces check
        .test(
            'no-consecutive-spaces',
            'Company address line 1 cannot contain consecutive whitespaces.',
            value => {
                if (!value) return true;
                return !/\s{2,}/.test(value);
            }
        )
        .min(3, 'Company address line 1 must be at least 3 characters long')
        .test(
            'address-not-same',
            'Address Line 1 and Line 2 cannot be the same',
            function addressMatch(value) {
                const line2 = this.parent.companyAddressLine2;
                if (!value || !line2) return true; // skip if one is empty
                return value.trim() !== line2.trim();
            }
        ),

    companyAddressLine2: Yup.string()
        .test(
            'no-leading-space',
            'Company address line 2 cannot start with a whitespace.',
            value => {
                if (!value) return true;
                return value.trimStart() === value;
            }
        )
        // Trailing space check
        .test(
            'no-trailing-space',
            'Company address line 2 cannot end with a whitespace.',
            value => {
                if (!value) return true;
                return value.trimEnd() === value;
            }
        )
        // Consecutive spaces check
        .test(
            'no-consecutive-spaces',
            'Company address line 2 cannot contain consecutive whitespaces.',
            value => {
                if (!value) return true;
                return !/\s{2,}/.test(value);
            }
        )
        .min(3, 'Company address line 2 must be at least 3 characters long'),
    city: Yup.string()
        .test(
            'no-leading-space',
            'City name cannot start with a whitespace.',
            value => !value || value.trimStart() === value
        )
        .test(
            'no-trailing-space',
            'City name cannot end with a whitespace.',
            value => !value || value.trimEnd() === value
        )
        .test(
            'no-consecutive-spaces',
            'City name cannot contain consecutive  whitespaces.',
            value => !value || !/\s{2,}/.test(value)
        )
        .min(3, 'City name must be at least 3 characters long')
        .required('Please enter the city name'),

    state: Yup.string()
        .required('Please select state')
        .min(3, 'State must be at least 3 characters long'),

    pinCode: Yup.string()
        .required('Please enter PIN code')
        .matches(/^[0-9]{6}$/, 'PIN code must be a 6-digit number'),

    contactNumber: Yup.string()
        .matches(/^[0-9]{10}$/, 'Contact number must be a 10-digit number')
        .required('Please enter your contact number'),

    emailAddress: Yup.string()
        .email('Please enter a valid email address')
        .required('Please enter your email address'),

    companyLogo: Yup.mixed().nullable().notRequired(), // No validation added for image file

    industry: Yup.string().nullable().notRequired(), // Optional field

    PAN: Yup.string()
        .required('Please enter your PAN number')
        .min(10, 'PAN must be 10 characters long')
        .matches(
            /^[A-Z]{3}[CFHATBLJG][A-Z][0-9]{4}[A-Z]$/,
            'PAN must be a valid Business/Corporate PAN'
        ),

    TAN: Yup.string()
        .matches(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, 'Please enter a valid TAN')

        .required('Please enter the TAN'),
    TDSCode: Yup.string()
        .transform(value => value?.toUpperCase())
        .matches(
            /^[A-Z]{3}[WCR][0-9]{3,4}$/,
            'Please enter a valid TDS Circle/AO Code (e.g. DELW0101 or NWRC881)'
        )
        .required('Please enter the TDS Circle/AO Code'),

    taxPaymentFrequency: Yup.string()
        .oneOf(['MONTHLY', 'QUARTERLY', 'ANNUALLY'], 'Please select a valid frequency')

        .required('Please select Tax Payment Frequency'),
});

export const bankDetailsSchema = Yup.object().shape({
    bankName: Yup.string()
        .required('Please enter the bank name')
        .min(3, 'Bank name must be at least 3 characters long')
        .matches(
            noExtraSpacesRegex,
            'Bank name cannot contain leading, trailing, or multiple spaces'
        ),
    accountNumber: Yup.string()
        .matches(/^[0-9]{5,25}$/, 'Account number must be between 5 to 25 digits')
        .required('Please enter the account number'),
    accountHolderName: Yup.string()
        .required('Please enter the account holder name')
        .min(3, 'Account holder name must be at least 3 characters long')
        .matches(
            noExtraSpacesRegex,
            'Account holder name cannot contain leading, trailing, or multiple spaces'
        ),
    ifscCode: Yup.string()
        .min(11, 'IFSC code must be 11 characters')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code')
        .required('Please enter the IFSC code'),
    branchAddress: Yup.string()
        .required('Please enter the branch address')
        .min(10, 'Branch address must be at least 10 characters long')
        .matches(
            noExtraSpacesRegex,
            'Branch address cannot contain leading, trailing, or multiple spaces'
        ),
});
export const payrollCycleSchema = Yup.object().shape({
    selectWorkingDays: Yup.array()
        .of(Yup.string().required())
        .min(1, 'Please select at least one working day')
        .required('Please select the working days'),

    calculateSalaryBasedOn: Yup.string()
        .oneOf(['ACTUALDAYS', 'COMPANYWORKINGDAYS'], 'Please select a valid option')
        .required('Please select a salary calculation basis'),

    payEmployeeOn: Yup.number()
        .required('Please select the payment day')
        .min(1, 'Day must be between 1 and 28')
        .max(28, 'Day must be between 1 and 28')
        .nullable(),

    payrollFrom: Yup.date().required('Please enter the payroll start date').nullable(),
});
export const salaryCompFormSchema = Yup.object().shape({
    componentName: Yup.string()
        .required('Please enter the component name')
        .test(
            'no-leading-trailing-space',
            'Component name cannot start or end with blank space.',
            value => {
                if (!value) return true;
                return value.trim() === value;
            }
        )
        .test(
            'no-consecutive-spaces',
            'Component name cannot contain consecutive blank spaces.',
            value => {
                if (!value) return true;
                return !/\s{2,}/.test(value);
            }
        ),
    calculationType: Yup.string().required('Please select the calculation type'),
    amountPercentage: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .typeError('Please enter a valid number')

        .when('calculationType', {
            is: 'FIXED',
            then: schema =>
                schema.required('Please enter amount').moreThan(0, 'Amount must be greater than 0'),
            otherwise: schema =>
                schema.when('calculationType', {
                    is: 'BALANCING',
                    then: s => s.notRequired(),
                    otherwise: s =>
                        s
                            .required('Please enter percentage')
                            .moreThan(0, 'Percentage must be greater than 0')
                            .max(100, 'Percentage cannot be more than 100'),
                }),
        }),
    calculationBasis: Yup.string().when('calculationType', {
        is: 'PERCENTAGE',
        then: schema => schema.required('Please select a calculation basis'),
        otherwise: schema => schema.notRequired(),
    }),
    calculationBasedOn: Yup.string().when(['calculationType', 'calculationBasis'], {
        is: (calculationType: string, calculationBasis: string) =>
            calculationType === 'PERCENTAGE' &&
            (calculationBasis === 'COMPONENT' || !calculationBasis),
        then: schema =>
            schema
                .required('Please select a calculation basis')
                .min(1, 'Calculation basis must be at least 1 character long')
                .max(100, 'Calculation basis must be less than or equal to 100 characters'),
        otherwise: schema => schema.notRequired(), // If not PERCENTAGE, make it not required
    }),

    status: Yup.string().required('Please select the status'),
});
export const deductionCompFormSchema = Yup.object().shape({
    deductionName: Yup.string()
        .required('Please enter the deduction name')
        .test(
            'no-leading-trailing-space',
            'Deduction name cannot start or end with blank space.',
            value => {
                if (!value) return true;
                return value.trim() === value;
            }
        )
        .test(
            'no-consecutive-spaces',
            'Deduction name cannot contain consecutive blank spaces.',
            value => {
                if (!value) return true;
                return !/\s{2,}/.test(value);
            }
        ),
    calculationType: Yup.string().required('Please select a calculation type'),
    salaryDeductionType: Yup.string().test(
        'no-leading-trailing-space',
        'Please Select a deduction type',
        (value, context) => {
            if (context.parent.calculationType === 'PERCENTAGE' && !value) {
                return false;
            }
            return true;
        }
    ),
    amountPercentage: Yup.number()
        .typeError('Please enter a valid number')
        .required('Please enter amount or percentage')
        .when('calculationType', {
            is: 'PERCENTAGE',
            then: schema =>
                schema
                    .moreThan(0, 'Percentage must be greater than 0')
                    .max(100, 'Percentage cannot be more than 100'),
            otherwise: schema => schema.moreThan(0, 'Amount must be greater than 0'),
        }),
    status: Yup.string().required('Please select a status'),
    applicabilityCriteria: Yup.string().nullable(),
});

export const leaveConfigFormSchema = Yup.object().shape({
    leaveType: Yup.string()
        .required('Please enter the leave type')
        .min(3, 'Leave type must be at least 3 characters long')
        .matches(
            /^(?!\s)(?!.*\s{2,})(?!.*\s$).+$/,
            'Leave type cannot contain leading, trailing, or multiple whitespaces'
        ),

    accrualType: Yup.string().required('Please select the accrual type'),

    accrualRate: Yup.string().when('accrualType', {
        is: (value: string) => ['MONTHLY', 'DAILY'].includes(value),
        then: schema =>
            schema
                .required('Please enter the accrual rate')
                .matches(/^\d+(\.\d+)?$/, 'Accrual rate must be a valid number'),
        otherwise: schema => schema.notRequired(),
    }),

    maximumAccrual: Yup.string().when('accrualType', {
        is: (value: string) => ['MONTHLY', 'DAILY'].includes(value),
        then: schema =>
            schema
                .required('Please enter the maximum accual')
                .matches(/^\d+$/, 'Maximum accrual must be a whole number'),
        otherwise: schema => schema.notRequired(),
    }),

    leaveBalanceCarryover: Yup.string().required(
        'Please select whether the leave balance can be carried over'
    ),

    maximumNumberOfLeaves: Yup.string()
        .required('Please enter the maximum number of leaves')
        .matches(/^\d+$/, 'Maximum number of leaves must be a whole number')
        .test('min-value', 'Must be at least 1', value => Number(value) >= 1),

    applicableGender: Yup.string().required('Please select the applicable gender'),
});
