import * as Yup from 'yup';

import { emailRegex } from '@utils/regex';

// PROTOTYPE-FLOW: payrollGratuitySchema removed with the UAE end-of-service gratuity calculator.
export const payrollOvertimeSchema = Yup.object().shape({
    employeeId: Yup.string().required('Please select an employee'),
    extraHours: Yup.number()
        .required('Please enter the extra hours')
        .moreThan(0, 'Extra hours must be greater than 0'),
    overTimeDate: Yup.string().required('Please select an overtime date'),
    overTimeRate: Yup.number()
        .required('Please enter an overtime rate')
        .moreThan(0, 'Over time rate must be greater than 0'),
});
export const payrollIncentivesSchema = Yup.object().shape({
    employeeId: Yup.string().required('Please select an employee'),
    incentiveDate: Yup.string().required('Please select the effective date'),
    details: Yup.string()
        // No leading space
        .test('no-leading-space', 'Incentives details cannot start with a whitespace', value =>
            value ? value[0] !== ' ' : true
        )

        // No trailing space
        .test('no-trailing-space', 'Incentives details cannot end with a whitespace', value =>
            value ? value[value.length - 1] !== ' ' : true
        )
        // No consecutive spaces
        .test(
            'no-consecutive-spaces',
            'Incentives details cannot contain consecutive whitespaces',
            value => (value ? !/\s{2,}/.test(value) : true)
        )
        .min(3, 'Incentives details must be at least 3 characters')
        .required('Please enter the incentive details'),
    amount: Yup.number()
        .required('Please enter the incentives amount')
        .moreThan(0, 'Incentives amount must be greater than 0'),
});
export const payrollBonusSchema = Yup.object().shape({
    bonusDate: Yup.string().required('Please select the bonus date'),
    bonusAmount: Yup.number()
        .required('Please enter the bonus amount')
        .moreThan(0, 'Bonus amount must be greater than 0'),
});
// Merged "Bonus & Incentives" form (Extra Benefits consolidation) — validates whichever
// half of the fields applies based on the selected Type, routing to the Bonus entity for
// every type except 'INCENTIVE'.
export const payrollBonusAndIncentiveSchema = Yup.object().shape({
    type: Yup.string().required('Please select a type'),
    bonusDate: Yup.string().when('type', {
        is: (type: string) => type !== 'INCENTIVE',
        then: schema => schema.required('Please select the effective month'),
    }),
    bonusAmount: Yup.number().when('type', {
        is: (type: string) => type !== 'INCENTIVE',
        then: schema =>
            schema.required('Please enter the amount').moreThan(0, 'Amount must be greater than 0'),
    }),
    incentiveDate: Yup.string().when('type', {
        is: 'INCENTIVE',
        then: schema => schema.required('Please select the effective month'),
    }),
    amount: Yup.number().when('type', {
        is: 'INCENTIVE',
        then: schema => schema.required('Please enter the incentives amount').moreThan(0, 'Amount must be greater than 0'),
    }),
    details: Yup.string().when('type', {
        is: 'INCENTIVE',
        then: schema => schema.required('Please enter the incentive details').min(3, 'Details must be at least 3 characters'),
    }),
});
export const payrollReimbursementSchema = Yup.object().shape({
    expenseDate: Yup.string().required('Please select an expense date'),
    managerEmail: Yup.string()
        .required('Please enter manager email')
        .matches(emailRegex, 'Please enter a valid email'),
    category: Yup.string().required('Please select a category'),
    description: Yup.string()
        // No leading space
        .test('no-leading-space', 'Description cannot start with a whitespace', value =>
            value ? value[0] !== ' ' : true
        )
        // No trailing space
        .test('no-trailing-space', 'Description cannot end with a whitespace', value =>
            value ? value[value.length - 1] !== ' ' : true
        )
        // No consecutive spaces
        .test(
            'no-consecutive-spaces',
            'Description cannot contain consecutive whitespaces',
            value => (value ? !/\s{2,}/.test(value) : true)
        )
        .test('min-length', 'Description must be at least 3 characters', v => !v || v.length >= 3)
        .max(300, 'Description must be at most 300 characters'),

    totalPay: Yup.number()
        .typeError('Please enter the reimbursement amount')
        .required('Please enter the reimbursement amount')
        .moreThan(0, 'Reimbursement amount must be greater than 0'),
});
export const payrollIncrementSchema = Yup.object().shape({
    incrementPercentage: Yup.string().required('Please enter increment percentage'),
    incrementType: Yup.string().required('Please select transfer method'),
    incrementAmount: Yup.string().required('Please enter increment amount'),
    effectiveDate: Yup.string().required('Please select effective date'),
});
// Add/Edit Deduction — a typed one-time recovery. Same rules as the backend's
// validateDeductionDirect: type from the list, note required for "Other", whole rupees > 0.
const oneTimeDeductionFields = {
    deductionFor: Yup.string().required('Please choose what the deduction is for'),
    note: Yup.string()
        .trim()
        .max(200, 'Note can be at most 200 characters')
        .when('deductionFor', {
            is: 'Other',
            then: schema => schema.required('Add a note when the deduction is for "Other"'),
        }),
    amount: Yup.number()
        .typeError('Please enter amount')
        .required('Please enter amount')
        .integer('Amount must be in whole rupees')
        .moreThan(0, 'Amount must be more than ₹0'),
};
export const payrollDeductionSchema = Yup.object().shape({
    employeeId: Yup.string().required('Please select an employee'),
    ...oneTimeDeductionFields,
});
export const payrollEditDeductionSchema = Yup.object().shape(oneTimeDeductionFields);

export const payrollEPFSchema = Yup.object().shape({
    epfNumber: Yup.string()
        .matches(/^[^\s]/, 'EPF establishment code cannot start with a whitespace')
        .matches(/[^\s]$/, 'EPF establishment code cannot end with a whitespace')
        .matches(/^(?!.*\s{2,})/, 'EPF establishment code cannot contain consecutive whitespaces')
        .min(15, 'EPF establishment code must be at least 15 characters')

        .required('Please enter EPF establishment code'),

    pfWagesPolicy: Yup.string()
        .oneOf(['CAPPED_15000', 'FULL_BASIC'])
        .required('Please select a PF wages policy'),
    enableProRatedPfWage: Yup.boolean().optional(),
    considerSalaryComponents: Yup.boolean().optional(),
});
export const payrollEsiSchema = Yup.object().shape({
    esiNumber: Yup.string().required('Please enter ESI number'),
});
export const payrollLWFSchema = Yup.object().shape({
    EmployeeContriRate: Yup.number()
        .required('Please enter employee contribution rate')
        .typeError('Employee contribution rate must be a number')
        .min(0, 'Contribution rate must be positive')
        .max(100, 'Contribution rate cannot exceed 100%'),
    EmployerContriRate: Yup.number()
        .required('Please enter employer contribution rate')
        .typeError('Employer contribution rate must be a number')
        .min(0, 'Contribution rate must be positive')
        .max(100, 'Contribution rate cannot exceed 100%'),
    EmployeeContriAmount: Yup.number()
        .required('Please enter employee contribution amount')
        .typeError('Employee contribution amount must be a number')
        .min(0, 'Contribution amount must be positive'),
    EmployerContriAmount: Yup.number()
        .required('Please enter employer contribution amount')
        .typeError('Employer contribution amount must be a number')
        .min(0, 'Contribution amount must be positive'),
    status: Yup.string()
        .required('Please select the status')
        .oneOf(['Active', 'Inactive'], 'Please select a valid status'),
});

export const labWelfareSchema = Yup.object().shape({
    workState: Yup.string().required('Org work state is required'),
    registrationNumber: Yup.string().max(20, 'LWF registration number cannot exceed 20 characters'),
});

export const payrollPTSchema = Yup.object().shape({
    ptNumber: Yup.string()
        .max(15, 'PT registration number cannot be more than 15 characters')
        .required('Please enter PT registration number'),
});
