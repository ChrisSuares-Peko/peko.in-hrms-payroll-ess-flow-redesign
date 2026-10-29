import * as Yup from 'yup';

import { alphaNumeric, emailRegex, indianMobileRegex } from '@utils/regex';

import { DirectorInfo, EntityType } from '../types';

// ── Whitespace helpers (add tests to an existing schema chain) ────────────────
export const addNoLeadingSpace = (s: Yup.StringSchema, label: string) =>
    s.test('no-leading-space', `${label} cannot start with a blank space`, val => !val || !val.startsWith(' '));

export const addNoTrailingSpace = (s: Yup.StringSchema, label: string) =>
    s.test('no-trailing-space', `${label} cannot end with a blank space`, val => !val || !val.endsWith(' '));

export const addNoConsecutiveSpaces = (s: Yup.StringSchema, label: string) =>
    s.test(
        'no-consecutive-spaces',
        `${label} cannot contain consecutive whitespaces`,
        val => !val || !/ {2,}/.test(val)
    );

export const addNotOnlyWhitespace = (s: Yup.StringSchema, label: string) =>
    s.test(
        'not-only-whitespace',
        `${label} cannot be only whitespace`,
        val => !val || val.trim().length > 0
    );

export const addWhitespaceChecks = (s: Yup.StringSchema, label: string) =>
    addNotOnlyWhitespace(addNoConsecutiveSpaces(addNoTrailingSpace(addNoLeadingSpace(s, label), label), label), label);

// ── Basic Details ──────────────────────────────────────────────────────────────────
export const basicDetailsSchema = Yup.object().shape({
    applicantDetails: Yup.object().shape({
        fullName: Yup.string()
            .required('Please enter the full name')
            .test('no-edge-whitespace', 'Full name cannot start or end with whitespace', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
            .test('no-consecutive-spaces', 'Full name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
            .test('not-only-whitespace', 'Full name cannot be only whitespace', val => !val || val.trim().length > 0)
            .min(3, 'Full name must be at least 3 characters')
            .max(100, 'Full name cannot exceed 100 characters')
            .matches(/^[a-zA-Z\s]+$/, 'Please enter a valid full name using only letters'),
        email: Yup.string()
            .required('Please enter the email address')
            .email('Please enter a valid email address')
            .matches(emailRegex, 'Please enter a valid email address')
            .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
            .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
            .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
        mobile: Yup.string()
            .required('Please enter the mobile number')
            .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number'),
        state: Yup.string().required('Please select the state'),
    }),
    entityType: Yup.string()
        .required('Please select the entity type')
        .oneOf(
            [EntityType.PRIVATE_LIMITED, EntityType.PUBLIC_LIMITED, EntityType.OPC, EntityType.LLP],
            'Please select a valid entity type'
        ),
    proposedNames: Yup.object().shape({
        firstChoice: addWhitespaceChecks(
            Yup.string()
                .required('Please enter the first choice company name')
                .min(3, 'Company name must be at least 3 characters')
                .max(200, 'Company name cannot exceed 200 characters')
                .matches(
                    /^[a-zA-Z][a-zA-Z0-9\s&.'\-()]*$/,
                    'Please enter a valid company name using letters, numbers, spaces, - and &'
                ),
            'Company name'
        ),
        secondChoice: addWhitespaceChecks(
            Yup.string()
                .optional()
                .min(3, 'Company name must be at least 3 characters')
                .max(200, 'Company name cannot exceed 200 characters')
                .matches(/^[a-zA-Z][a-zA-Z0-9\s&.'\-()]*$/, {
                    message:
                        'Please enter a valid company name using letters, numbers, spaces, - and &',
                    excludeEmptyString: true,
                })
                .test(
                    'not-same-as-first-choice',
                    'Second choice cannot be the same as the first choice',
                    function notSameAsFirstChoice(value) {
                        if (!value) return true;
                        const first = this.parent?.firstChoice;
                        if (!first) return true;
                        return value.trim().toLowerCase() !== first.trim().toLowerCase();
                    }
                ),
            'Company name'
        ),
    }),
    registeredOffice: Yup.object().shape({
        availability: Yup.string()
            .required('Please select the office availability')
            .oneOf(['have', 'need'], 'Please select a valid option'),
        officeType: Yup.string().when('availability', {
            is: 'have',
            then: schema => schema.required('Please select the office type'),
            otherwise: schema => schema.optional(),
        }),
        address: Yup.string().when('availability', {
            is: 'have',
            then: schema =>
                schema
                    .required('Please enter the address')
                    .test('no-edge-whitespace', 'Full address cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
                    .test('no-consecutive-spaces', 'Address cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
                    .test('not-only-whitespace', 'Address cannot be only whitespace', val => !val || val.trim().length > 0)
                    .min(3, 'Address must be at least 3 characters')
                    .max(200, 'Address cannot exceed 200 characters')
                    .matches(alphaNumeric, 'Address can only contain letters, numbers, spaces, commas, and hyphens')
                    .test('contains-letter', 'Full address cannot contain only numbers', val => !val || /[a-zA-Z]/.test(val)),
            otherwise: schema => schema.optional(),
        }),
        hasIdProof: Yup.boolean().oneOf([true], 'You must confirm ID & address proofs for all Directors / Subscribers'),
        state: Yup.string().optional(),
    }),
}).test('llp-registration-state', 'Please select the state of registration', function llpRegistrationState(values) {
    if (values?.entityType === EntityType.LLP && !values?.registeredOffice?.state) {
        return this.createError({ path: 'registeredOffice.state', message: 'Please select the state of registration' });
    }
    return true;
});

// ── Cross-director uniqueness helper ──────────────────────────────────────────────
// Must return a regular function (not arrow) so Yup binds `this` context correctly.
const uniqueAcrossDirectors =
    (field: string, normalize: (v: string) => string = v => v) =>
    function uniqueDirectorFieldTest(this: any, value: string | undefined): boolean {
        if (!value) return true;
        const allDirectors = this.from?.[1]?.value?.directors;
        if (!Array.isArray(allDirectors)) return true;
        const match = (this.path as string).match(/\[(\d+)\]/);
        const currentIndex = match ? parseInt(match[1], 10) : -1;
        const normalized = normalize(value);
        return !allDirectors.some(
            (d: Record<string, unknown>, i: number) =>
                i !== currentIndex && d[field] && normalize(String(d[field])) === normalized
        );
    };

// ── Directors ──────────────────────────────────────────────────────────────────────
const directorShape = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the director name')
        .test('no-edge-whitespace', 'Name cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Name cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
    nationality: Yup.string().required('Please select the nationality'),
    email: Yup.string()
        .required('Please enter the email address')
        .email('Please enter a valid email address')
        .matches(emailRegex, 'Please enter a valid email address')
        .test(
            'unique-email',
            'Email address is already used by another director',
            uniqueAcrossDirectors('email', v => v.toLowerCase())
        )
        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
        .test(
            'unique-mobile',
            'Mobile number is already used by another director',
            uniqueAcrossDirectors('mobile')
        ),
    panNumber: Yup.string().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema
                .required('Please enter the PAN number')
                .length(10, 'PAN must be exactly 10 characters')
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
                .test(
                    'unique-pan',
                    'PAN number is already used by another director',
                    uniqueAcrossDirectors('panNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    passportNumber: Yup.string().when('nationality', {
        is: (val: string) => Boolean(val && val !== 'Indian'),
        then: schema =>
            schema
                .required('Please enter the passport number')
                .test('no-leading-space', 'Passport number cannot start with a blank space', value => !value || !value.startsWith(' '))
                .test('not-only-whitespace', 'Passport number cannot be only whitespace', value => !value || value.trim().length > 0)
                .min(5, 'Passport number must be at least 5 characters')
                .max(20, 'Passport number cannot exceed 20 characters')
                .matches(/^[A-Z0-9]+$/, 'Passport number can only contain uppercase letters and digits')
                .test(
                    'unique-passport',
                    'Passport number is already used by another director',
                    uniqueAcrossDirectors('passportNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    din: Yup.string()
        .optional()
        .matches(/^[0-9]{8}$/, {
            message: 'DIN must be exactly 8 digits',
            excludeEmptyString: true,
        })
        .test(
            'unique-din',
            'DIN is already used by another director',
            uniqueAcrossDirectors('din')
        ),
    requestDSCfromPeko: Yup.boolean().when('hasDSC', {
        is: false,
        then: schema => schema.oneOf([true], 'Please check this box to request Peko to apply for DSC, or toggle on if you already have one'),
        otherwise: schema => schema.optional(),
    }),
    educationQualification: Yup.string()
        .required('Please enter the education qualification')
        .test('no-edge-whitespace', 'Education Qualification cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Education qualification cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Education qualification cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Education Qualification must be at least 3 characters')
        .max(200, 'Education qualification cannot exceed 200 characters')
        .matches(
            /^(?=.*[a-zA-Z])[a-zA-Z0-9\s.,()-]+$/,
            'Please enter the valid Education Qualification'
        ),
    occupation: Yup.string()
        .required('Please enter the occupation')
        .test('no-edge-whitespace', 'Occupation cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Occupation cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Occupation cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Occupation must be at least 3 characters')
        .max(200, 'Occupation cannot exceed 200 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Please enter the valid occupation'),
    placeOfBirth: Yup.object().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema.shape({
                state: Yup.string().required('Please select the state of birth'),
                district: addWhitespaceChecks(
                    Yup.string()
                        .required('Please enter the district of birth')
                        .min(2, 'District must be at least 2 characters')
                        .max(100, 'District cannot exceed 100 characters')
                        .matches(/^[a-zA-Z\s]+$/, 'District can only contain alphabets and spaces'),
                    'District'
                ),
            }),
        otherwise: schema => schema.optional().nullable(),
    }),
});

// ── Nominee (OPC only) ────────────────────────────────────────────────────────────
const notSameAsOpcDirector =
    (field: string, normalize: (v: string) => string = v => v) =>
    function notSameAsDirectorTest(this: any, value: string | undefined): boolean {
        if (!value) return true;
        const director = this.from?.[1]?.value?.directors?.[0];
        if (!director) return true;
        const directorVal = (director as Record<string, unknown>)[field];
        if (!directorVal) return true;
        return normalize(value) !== normalize(String(directorVal));
    };

const nomineeShape = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the nominee name')
        .test('no-edge-whitespace', 'Name cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Name cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
    nationality: Yup.string().required('Please select the nationality'),
    email: Yup.string()
        .required('Please enter the email address')
        .email('Please enter a valid email address')
        .matches(emailRegex, 'Please enter a valid email address')
        .test(
            'nominee-not-director-email',
            "Nominee email cannot be the same as the director's email",
            notSameAsOpcDirector('email', v => v.toLowerCase())
        )
        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
        .test(
            'nominee-not-director-mobile',
            "Nominee mobile number cannot be the same as the director's mobile number",
            notSameAsOpcDirector('mobile')
        ),
    panNumber: Yup.string().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema
                .required('Please enter the PAN number')
                .length(10, 'PAN must be exactly 10 characters')
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
                .test(
                    'nominee-not-director-pan',
                    "Nominee PAN cannot be the same as the director's PAN",
                    notSameAsOpcDirector('panNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    passportNumber: Yup.string().when('nationality', {
        is: (val: string) => Boolean(val && val !== 'Indian'),
        then: schema =>
            schema
                .required('Please enter the passport number')
                .test('no-leading-space', 'Passport number cannot start with a blank space', value => !value || !value.startsWith(' '))
                .test('not-only-whitespace', 'Passport number cannot be only whitespace', value => !value || value.trim().length > 0)
                .min(5, 'Passport number must be at least 5 characters')
                .max(20, 'Passport number cannot exceed 20 characters')
                .matches(/^[A-Z0-9]+$/, 'Passport number can only contain uppercase letters and digits')
                .test(
                    'nominee-not-director-passport',
                    "Nominee passport cannot be the same as the director's passport",
                    notSameAsOpcDirector('passportNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    din: Yup.string()
        .optional()
        .matches(/^[0-9]{8}$/, { message: 'DIN must be exactly 8 digits', excludeEmptyString: true }),
    educationQualification: Yup.string()
        .required('Please enter the education qualification')
        .test('no-edge-whitespace', 'Education Qualification cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Education qualification cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Education qualification cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Education Qualification must be at least 3 characters')
        .max(200, 'Education qualification cannot exceed 200 characters')
        .matches(
            /^(?=.*[a-zA-Z])[a-zA-Z0-9\s.,()-]+$/,
            'Please enter the valid Education Qualification'
        ),
    occupation: Yup.string()
        .required('Please enter the occupation')
        .test('no-edge-whitespace', 'Occupation cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Occupation cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Occupation cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Occupation must be at least 3 characters')
        .max(200, 'Occupation cannot exceed 200 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Please enter the valid occupation'),
    placeOfBirth: Yup.object().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema.shape({
                state: Yup.string().required('Please select the state of birth'),
                district: addWhitespaceChecks(
                    Yup.string()
                        .required('Please enter the district of birth')
                        .min(2, 'District must be at least 2 characters')
                        .max(100, 'District cannot exceed 100 characters')
                        .matches(/^[a-zA-Z\s]+$/, 'District can only contain alphabets and spaces'),
                    'District'
                ),
            }),
        otherwise: schema => schema.optional().nullable(),
    }),
});

const DIRECTOR_LIMITS: Record<string, { min: number; max: number | null; minMsg: string }> = {
    [EntityType.PRIVATE_LIMITED]: { min: 2, max: 15, minMsg: 'At least 2 directors are required for a Private Limited company' },
    [EntityType.PUBLIC_LIMITED]: { min: 3, max: 15, minMsg: 'At least 3 directors are required for a Public Limited company' },
    [EntityType.OPC]: { min: 1, max: 1, minMsg: 'Exactly 1 director is required for OPC' },
};

export const getDirectorsSchema = (entityType: string) => {
    const limits = DIRECTOR_LIMITS[entityType] ?? { min: 1, max: null, minMsg: 'At least one director is required' };
    let directorsArray = Yup.array().of(directorShape).min(limits.min, limits.minMsg);
    if (limits.max !== null) {
        directorsArray = directorsArray.max(limits.max, `Maximum ${limits.max} director${limits.max > 1 ? 's' : ''} allowed`);
    }
    if (entityType === EntityType.OPC) {
        return Yup.object().shape({
            directors: directorsArray,
            additionalShareholders: Yup.array()
                .of(opcAdditionalShareholderShape)
                .max(1, 'An OPC can have only one shareholder'),
            nominee: nomineeShape.required('Nominee details are required for OPC'),
        });
    }
    return Yup.object().shape({ directors: directorsArray });
};

const directorShapeLLP = directorShape.shape({
    name: Yup.string()
        .required('Please enter the partner name')
        .test('no-edge-whitespace', 'Name cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Name cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
    email: Yup.string()
        .required('Please enter the email address')
        .email('Please enter a valid email address')
        .matches(emailRegex, 'Please enter a valid email address')
        .test(
            'unique-email',
            'Email address is already used by another partner',
            uniqueAcrossDirectors('email', v => v.toLowerCase())
        )
        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
        .test(
            'unique-mobile',
            'Mobile number is already used by another partner',
            uniqueAcrossDirectors('mobile')
        ),
    panNumber: Yup.string().when('nationality', {
        is: 'Indian',
        then: schema =>
            schema
                .required('Please enter the PAN number')
                .length(10, 'PAN must be exactly 10 characters')
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
                .test(
                    'unique-pan',
                    'PAN number is already used by another partner',
                    uniqueAcrossDirectors('panNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    passportNumber: Yup.string().when('nationality', {
        is: (val: string) => Boolean(val && val !== 'Indian'),
        then: schema =>
            schema
                .required('Please enter the passport number')
                .min(5, 'Passport number must be at least 5 characters')
                .max(20, 'Passport number cannot exceed 20 characters')
                .matches(/^[A-Z0-9]+$/, 'Passport number can only contain uppercase letters and digits')
                .test(
                    'unique-passport',
                    'Passport number is already used by another partner',
                    uniqueAcrossDirectors('passportNumber', v => v.toUpperCase())
                ),
        otherwise: schema => schema.optional().nullable(),
    }),
    din: Yup.string()
        .optional()
        .matches(/^[0-9]{8}$/, {
            message: 'DIN must be exactly 8 digits',
            excludeEmptyString: true,
        })
        .test(
            'unique-din',
            'DIN is already used by another partner',
            uniqueAcrossDirectors('din')
        ),
});

export const directorsSchemaLLP = Yup.object().shape({
    directors: Yup.array().of(directorShapeLLP).min(2, 'At least 2 designated partners are required for LLP'),
});

// ── OPC additional-shareholder helpers ───────────────────────────────────────────
const uniqueAcrossAdditionalShareholders =
    (field: string, normalize: (v: string) => string = v => v) =>
    function uniqueAdditionalShareholderTest(this: any, value: string | undefined): boolean {
        if (!value) return true;
        const all = this.from?.[1]?.value?.additionalShareholders;
        if (!Array.isArray(all)) return true;
        const match = (this.path as string).match(/\[(\d+)\]/);
        const currentIndex = match ? parseInt(match[1], 10) : -1;
        const normalized = normalize(value);
        return !all.some(
            (sh: Record<string, unknown>, i: number) =>
                i !== currentIndex && sh[field] && normalize(String(sh[field])) === normalized
        );
    };

const opcAdditionalShareholderShape = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the name')
        .test('no-edge-whitespace', 'Name cannot start or end with a blank space', val => !val || (!val.startsWith(' ') && !val.endsWith(' ')))
        .test('no-consecutive-spaces', 'Name cannot contain consecutive whitespaces', val => !val || !/ {2,}/.test(val))
        .test('not-only-whitespace', 'Name cannot be only whitespace', val => !val || val.trim().length > 0)
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .matches(/^[a-zA-Z\s]+$/, 'Name can only contain alphabets and spaces'),
    nationality: Yup.string().required('Please select the nationality'),
    email: Yup.string()
        .required('Please enter the email address')
        .email('Please enter a valid email address')
        .matches(emailRegex, 'Please enter a valid email address')
        .test(
            'unique-email-additional',
            'Email is already used by another shareholder',
            uniqueAcrossAdditionalShareholders('email', v => v.toLowerCase())
        )
        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
        .test(
            'unique-mobile-additional',
            'Mobile number is already used by another shareholder',
            uniqueAcrossAdditionalShareholders('mobile')
        ),
    panNumber: Yup.string()
        .required('Please enter the PAN number')
        .length(10, 'PAN must be exactly 10 characters')
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
        .test(
            'unique-pan-additional',
            'PAN number is already used by another shareholder',
            uniqueAcrossAdditionalShareholders('panNumber', v => v.toUpperCase())
        ),
});

// ── Cross-shareholder uniqueness helper ───────────────────────────────────────────
// Only flags the later duplicate (checks against prior indexes only) so exactly
// one error message appears when a value is duplicated across shareholders.
const uniqueAcrossShareholders =
    (field: string, normalize: (v: string) => string = v => v) =>
    function uniqueShareholderFieldTest(this: any, value: string | undefined): boolean {
        if (!value) return true;
        const allShareholders = this.from?.[1]?.value?.shareholders;
        if (!Array.isArray(allShareholders)) return true;
        const match = (this.path as string).match(/\[(\d+)\]/);
        const currentIndex = match ? parseInt(match[1], 10) : -1;
        const normalized = normalize(value);
        return !allShareholders.some(
            (sh: Record<string, unknown>, i: number) =>
                i < currentIndex && sh[field] && normalize(String(sh[field])) === normalized
        );
    };

// ── Capital & Shareholding ─────────────────────────────────────────────────────────
const SHAREHOLDER_LIMITS: Record<string, { min: number; max: number | null }> = {
    [EntityType.PRIVATE_LIMITED]: { min: 2, max: 200 },
    [EntityType.PUBLIC_LIMITED]: { min: 7, max: null },
    [EntityType.OPC]: { min: 1, max: 1 },
};

export const getCapitalSchema = (entityType: string) => {
    const limits = SHAREHOLDER_LIMITS[entityType] ?? { min: 1, max: null };

    return Yup.object().shape({
        capital: Yup.object().shape({
            authorizedCapital: Yup.number()
                .typeError('Authorized capital must be a number')
                .required('Please enter the authorized capital')
                .min(100000, 'Authorized capital must be at least ₹1,00,000'),
            paidUpCapital: Yup.number()
                .typeError('Paid-up capital must be a number')
                .required('Please enter the paid-up capital')
                .min(1, 'Paid-up capital must be greater than 0')
                .max(Yup.ref('authorizedCapital'), 'Paid-up capital cannot exceed authorized capital')
                .test(
                    'divisible-by-face-value',
                    'Paid-up capital must be exactly divisible by face value per share (shares must be whole numbers)',
                    function paidUpDivisibleByFaceValue(paidUp) {
                        const faceValue = this.parent?.faceValuePerShare;
                        if (!paidUp || !faceValue || faceValue === 0) return true;
                        return paidUp % faceValue === 0;
                    }
                ),
            faceValuePerShare: Yup.number()
                .typeError('Face value must be a number')
                .required('Please enter the face value per share')
                .min(1, 'Face value must be at least ₹1'),
            shareholders: Yup.array()
                .of(
                    Yup.object().shape({
                        name: addNotOnlyWhitespace(
                            addNoTrailingSpace(
                                addNoLeadingSpace(
                                    Yup.string()
                                        .required('Please enter the shareholder name')
                                        .min(2, 'Name must be at least 2 characters'),
                                    'Shareholder name'
                                ),
                                'Shareholder name'
                            ),
                            'Shareholder name'
                        ),
                        shareholding: Yup.number()
                            .typeError('Shareholding must be a number')
                            .required('Please enter the shareholding percentage')
                            .min(0.01, 'Shareholding must be greater than 0')
                            .max(100, 'Shareholding cannot exceed 100%'),
                        panNumber: Yup.string()
                            .optional()
                            .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
                                message: 'Invalid PAN format (e.g. ABCDE1234F)',
                                excludeEmptyString: true,
                            })
                            .test(
                                'unique-pan',
                                'PAN number is already used by another shareholder',
                                uniqueAcrossShareholders('panNumber', v => v.toUpperCase())
                            ),
                        passportNumber: Yup.string()
                            .optional()
                            .matches(/^[A-Z0-9]+$/, {
                                message: 'Passport number can only contain uppercase letters and digits',
                                excludeEmptyString: true,
                            })
                            .test(
                                'unique-passport',
                                'Passport number is already used by another shareholder',
                                uniqueAcrossShareholders('passportNumber', v => v.toUpperCase())
                            ),
                        email: Yup.string()
                            .optional()
                            .email('Please enter a valid email address')
                            .matches(emailRegex, 'Please enter a valid email address')
                            .test(
                                'unique-email',
                                'Email address is already used by another shareholder',
                                uniqueAcrossShareholders('email', v => v.toLowerCase())
                            )
                            .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
                            .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
                            .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
                    })
                )
                .min(
                    limits.min,
                    `At least ${limits.min} shareholder${limits.min > 1 ? 's are' : ' is'} required for this entity type`
                )
                .test(
                    'max-shareholders',
                    `Maximum ${limits.max} shareholders allowed for this entity type`,
                    arr => !limits.max || !arr || arr.length <= limits.max
                )
                .test(
                    'total-shareholding-100',
                    'Total shareholding must equal 100%',
                    shareholders => {
                        if (!shareholders || shareholders.length === 0) return true;
                        const total = shareholders.reduce((sum, sh) => sum + (sh.shareholding || 0), 0);
                        return Math.abs(total - 100) < 0.1;
                    }
                ),
        }),
    });
};

export const capitalSchemaLLP = Yup.object().shape({
    capital: Yup.object().shape({
        authorizedCapital: Yup.number()
            .typeError('Initial contribution must be a number')
            .required('Please enter the initial contribution')
            .min(1, 'Initial contribution must be greater than 0'),
        shareholders: Yup.array()
            .of(
                Yup.object().shape({
                    sharesAllotted: Yup.number()
                        .typeError('Contribution amount must be a number')
                        .min(1, 'Contribution amount must be at least ₹1'),
                    panNumber: Yup.string()
                        .optional()
                        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
                            message: 'Invalid PAN format (e.g. ABCDE1234F)',
                            excludeEmptyString: true,
                        })
                        .test(
                            'unique-pan',
                            'PAN number is already used by another partner',
                            uniqueAcrossShareholders('panNumber', v => v.toUpperCase())
                        ),
                    passportNumber: Yup.string()
                        .optional()
                        .matches(/^[A-Z0-9]+$/, {
                            message: 'Passport number can only contain uppercase letters and digits',
                            excludeEmptyString: true,
                        })
                        .test(
                            'unique-passport',
                            'Passport number is already used by another partner',
                            uniqueAcrossShareholders('passportNumber', v => v.toUpperCase())
                        ),
                    email: Yup.string()
                        .optional()
                        .email('Please enter a valid email address')
                        .matches(emailRegex, 'Please enter a valid email address')
                        .test(
                            'unique-email',
                            'Email address is already used by another partner',
                            uniqueAcrossShareholders('email', v => v.toLowerCase())
                        )
                        .test('no-leading-whitespace', 'Email cannot start with whitespace', value => !value || !/^\s/.test(value))
                        .test('no-multiple-whitespace', 'Email cannot contain consecutive whitespaces', value => !value || !/\s{2,}/.test(value))
                        .test('not-only-whitespace', 'Email cannot be only whitespace', value => !value || !/^\s*$/.test(value)),
                })
            )
            .min(2, 'At least 2 partners are required for LLP')
            .test(
                'total-shareholding-100',
                'Total profit sharing must equal 100%',
                shareholders => {
                    if (!shareholders || shareholders.length === 0) return true;
                    const total = shareholders.reduce((sum, sh) => sum + ((sh as any).shareholding || 0), 0);
                    return Math.abs(total - 100) < 0.1;
                }
            ),
    }),
});

// ── Business Activity ──────────────────────────────────────────────────────────────
export const businessActivitySchema = Yup.object().shape({
    businessActivity: Yup.object().shape({
        section: Yup.string().required('Please select the section'),
        division: Yup.string().required('Please select the division'),
        group: Yup.string().required('Please select the group'),
        otherActivities: addWhitespaceChecks(
            Yup.string()
                .optional()
                .test('max-activities', 'You can add a maximum of 13 other activities', value => {
                    if (!value) return true;
                    const lines = value.split('\n').filter(line => line.trim().length > 0);
                    return lines.length <= 13;
                }),
            'Other activities'
        ),
        description: addWhitespaceChecks(
            Yup.string()
                .required('Please enter the Business description')
                .min(10, 'Description must be at least 10 characters')
                .max(1000, 'Description cannot exceed 1000 characters'),
            'Description'
        ),
    }),
});

// ── MOA & AOA ─────────────────────────────────────────────────────────────────────
export const moaAoaSchema = Yup.object().shape({
    moaAoa: Yup.object().shape({
        moaType: Yup.string()
            .required('Please select the MOA type')
            .oneOf(['standard', 'custom'], 'Please select a valid MOA type'),
        aoaType: Yup.string()
            .required('Please select the AOA type')
            .oneOf(['standard', 'customized'], 'Please select a valid AOA type'),
        confirmed: Yup.boolean().oneOf([true], 'You must confirm the MOA and AOA are appropriate'),
    }),
});

// ── Memorandum ────────────────────────────────────────────────────────────────────
export const memorandumSchema = Yup.object().shape({
    memorandumPath: Yup.string().optional(),
    articlePath: Yup.string().optional(),
    llpAgreementPath: Yup.string().optional(),
});

// ── LLP Agreement ─────────────────────────────────────────────────────────────────
export const llpAgreementSchema = Yup.object().shape({
    llpAgreement: Yup.object().shape({
        agreementType: Yup.string()
            .required('Please select the agreement type')
            .oneOf(['standard', 'custom'], 'Please select a valid agreement type'),
        partnerRights: Yup.object().shape({
            accessBooks: Yup.boolean(),
            receiveShares: Yup.boolean(),
            participateVotes: Yup.boolean(),
            indemnified: Yup.boolean(),
            separateBusiness: Yup.boolean(),
        }),
        partnerDuties: Yup.object().shape({
            accountBenefits: Yup.boolean(),
            indemnifyFraud: Yup.boolean(),
            renderAccounts: Yup.boolean(),
            actInBestInterest: Yup.boolean(),
            noCompeting: Yup.boolean(),
            maintainConfidentiality: Yup.boolean(),
        }),
        meetingQuorum: Yup.string().required('Please enter the meeting quorum'),
        votingThreshold: Yup.string().required('Please enter the voting threshold'),
        disputeResolution: Yup.object().shape({
            method: Yup.string().required('Please select the dispute resolution method'),
            jurisdiction: addNotOnlyWhitespace(
                addNoTrailingSpace(
                    addNoLeadingSpace(
                        Yup.string()
                            .required('Please enter the jurisdiction')
                            .matches(
                                /^[a-zA-Z\s,.\-()]+$/,
                                'Jurisdiction can only contain letters, spaces, commas, and hyphens (e.g. Delhi, Mumbai)'
                            ),
                        'Jurisdiction'
                    ),
                    'Jurisdiction'
                ),
                'Jurisdiction'
            ),
        }),
        confirmed: Yup.boolean().oneOf([true], 'You must confirm the LLP Agreement'),
    }),
});

// ── Documents ─────────────────────────────────────────────────────────────────────
const isDocUploaded = (value: unknown): boolean =>
    Boolean(value && typeof value === 'object' && 'fileName' in (value as object));

const docField = (message: string) => Yup.mixed().test('uploaded', message, isDocUploaded);

export const documentsSchema = Yup.lazy((values: unknown) => {
    const vals = (values as Record<string, unknown>) || {};
    const directors = (vals.directors as unknown[]) || [];
    const hasOffice =
        (vals.registeredOffice as Record<string, unknown>)?.availability === 'have';

    const shape: Record<string, Yup.Schema> = {};

    if (hasOffice) {
        const officeType = (vals.registeredOffice as Record<string, unknown>)?.officeType as string;
        shape.nocFromOwner = docField('Please upload the NOC from Owner');
        if (officeType === 'owned') {
            shape.titleOrUtilityDoc = docField('Please upload the Title Document or Utility Bill (≤2 months old)');
        } else {
            // rented or shared_office
            shape.utilityBill = docField('Please upload the Utility Bill (≤2 months old)');
            shape.rentOrLeaseDeed = docField('Please upload the Rent Deed or Lease Deed');
        }
    }

    directors.forEach((dir: unknown, i) => {
        const d = dir as DirectorInfo;
        shape[`director_${i}_photo`] = docField('Please upload the Photo');
        if (d?.nationality === 'Indian') {
            shape[`director_${i}_proofOfIdentity`] = docField('Please upload the Proof of Identity');
            shape[`director_${i}_proofOfAddress`] = docField('Please upload the Proof of Address');
        } else {
            shape[`director_${i}_passport`] = docField('Please upload the Passport');
        }
    });

    return Yup.object().shape(shape);
}) as unknown as Yup.AnyObjectSchema;
