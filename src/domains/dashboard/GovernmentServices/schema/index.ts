import * as Yup from 'yup';

import { FormStep } from '../types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

const noLeadingOrTrailingWhitespace = {
    test: 'no-leading-or-trailing-whitespace',
    message: 'Cannot start or end with whitespace',
    testFn: (value?: string) => !value || value === value.trim(),
};

const getFieldSchema = (name: string, label: string, required: boolean, type?: string, allowAlphabetsAndSpaceOnly?: boolean, allowNumbersOnly?: boolean, minValue?: number, minLength?: number, maxLength?: number, maxValue?: number): Yup.StringSchema => {
    if (type === 'checkbox') {
        let schema: Yup.StringSchema = Yup.string();
        if (required) {
            schema = schema.test(
                'is-checked',
                `${label} must be checked to proceed`,
                (value) => value === 'true'
            );
        }
        return schema;
    }

    const lowerName = name.toLowerCase();
    let schema: Yup.StringSchema = Yup.string();

    if (lowerName.includes('email')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(emailRegex, 'Please enter a valid email address');
    } else if (lowerName.includes('mobile') || lowerName.includes('phone')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number starting with 6–9');
    } else if ((lowerName.startsWith('pan') || lowerName.endsWith('pan')) && !lowerName.includes('card') && !lowerName.includes('name')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(panRegex, 'Please enter a valid PAN (e.g., ABCDE1234F)');
    } else if ((lowerName.includes('gstin') || lowerName === 'gst') && type !== 'textarea') {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(gstinRegex, 'Please enter a valid GSTIN');
    } else if (lowerName.includes('cin')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(cinRegex, 'Please enter a valid CIN');
    } else if (lowerName.includes('ifsc')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(ifscRegex, 'Please enter a valid IFSC code (e.g., SBIN0001234)');
    } else if (lowerName.endsWith('tan')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(tanRegex, 'Please enter a valid TAN (e.g., ABCD12345E)');
    } else if (lowerName.includes('pincode') || lowerName.includes('zipcode')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(pincodeRegex, 'Please enter a valid 6-digit PIN code');
    } else if ((lowerName.includes('bankaccount') || lowerName.includes('accountnumber')) && type !== 'select') {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(/^\d{9,18}$/, 'Please enter a valid bank account number (9–18 digits)')
            .test('not-all-same-digit', 'Please enter a valid bank account number', value => !value || !/^(\d)\1+$/.test(value));
    } else if ((lowerName.includes('aadhaar') || lowerName.includes('aadhar')) && type !== 'select' && !lowerName.includes('name') && !lowerName.includes('type') && !lowerName.includes('holder')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(/^[2-9][0-9]{11}$/, 'Please enter a valid 12-digit Aadhaar number (cannot start with 0 or 1)');
    } else if (lowerName.includes('website')) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=#@]*)?$/, 'Please enter a valid website URL')
            .max(200, 'Maximum 200 characters are allowed');
    } else if (lowerName === 'contributioncurrency') {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .matches(/^[A-Z]{3}$/, 'Please enter a valid 3-letter currency code (e.g. USD, GBP)');
    } else if (allowNumbersOnly) {
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .test('no-multiple-whitespace', `${label} cannot contain consecutive blank spaces`, value => !value || !/\s{2,}/.test(value))
            .test('not-only-whitespace', `${label} cannot be only blank space`, value => !value || !/^\s*$/.test(value))
            .test('no-whitespace', `${label} cannot contain spaces`, value => !value || !/\s/.test(value));
        if (minLength !== undefined) schema = schema.min(minLength, `${label} must be at least ${minLength} digits`);
        if (maxLength !== undefined) schema = schema.max(maxLength, `${label} must be at most ${maxLength} digits`);
        if (minValue !== undefined) {
            schema = schema.test('min-value', `${label} must be at least ${minValue}`, value => (value === undefined || value === null || value === '') || Number(value) >= minValue);
        }
        if (maxValue !== undefined) {
            schema = schema.test('max-value', `${label} must be at most ${maxValue.toLocaleString('en-IN')}`, value => (value === undefined || value === null || value === '') || Number(value) <= maxValue);
        }
    } else if (type === 'textarea') {
        const maxChars = maxLength ?? 500;
        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .test('no-multiple-whitespace', `${label} cannot contain consecutive blank spaces`, value => !value || !/\s{2,}/.test(value))
            .test('not-only-whitespace', `${label} cannot be only blank space`, value => !value || !/^\s*$/.test(value))
            .max(maxChars, `Maximum ${maxChars} characters are allowed`);
        if (allowAlphabetsAndSpaceOnly) {
            schema = schema.matches(/^[a-zA-Z\s]+$/, `${label} must contain only alphabets and spaces`);
        }
        if (lowerName.includes('address') || lowerName.includes('placeofbusiness')) {
            schema = schema.test('no-numbers-only', 'Insufficient address', value => !value || /[a-zA-Z]/.test(value));
        }
    } else if (type !== 'select' && type !== 'radio' && type !== 'date' && type !== 'time') {
        const isAddressLine = lowerName.includes('addressline');
        const isBusinessOrTradeName = lowerName.includes('businessname') || lowerName.includes('tradebrandname') || lowerName === 'tradename' || lowerName.includes('enterprisename') || lowerName.includes('organisationname') || lowerName.includes('companyname') || lowerName.includes('legalname');
        const isCity = lowerName === 'city';
        const isPersonName = lowerName.includes('name') && !isBusinessOrTradeName && !lowerName.includes('actname');

        let fieldMaxLength = 50;
        if (isAddressLine || isBusinessOrTradeName) fieldMaxLength = 200;
        else if (isCity || isPersonName) fieldMaxLength = 100;

        schema = schema
            .test(noLeadingOrTrailingWhitespace.test, `${label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
            .test('no-multiple-whitespace', `${label} cannot contain consecutive blank spaces`, value => !value || !/\s{2,}/.test(value))
            .test('not-only-whitespace', `${label} cannot be only blank space`, value => !value || !/^\s*$/.test(value))
            .min(3, `${label} must be at least 3 characters`)
            .max(fieldMaxLength, `Maximum ${fieldMaxLength} characters are allowed`);

        if (isPersonName || isCity || lowerName === 'district' || allowAlphabetsAndSpaceOnly) {
            schema = schema.matches(/^[a-zA-Z\s]+$/, `${label} must contain only alphabets and spaces`);
        }

        if (isAddressLine) {
            schema = schema.test('no-numbers-only', 'Insufficient address', value => !value || /[a-zA-Z]/.test(value));
        }
    }

    if (required) {
        const lowerLabel = label.toLowerCase();
        const requiredMsg = type === 'select' || type === 'radio' || type === 'date' || type === 'time'
            ? `Please select ${lowerLabel}`
            : `Please enter ${lowerLabel}`;
        schema = schema.required(requiredMsg);
    }

    return schema;
};

export const generateStepSchema = (step: FormStep): Yup.ObjectSchema<Record<string, unknown>> => {
    if (step.stepType !== 'form') {
        return Yup.object().shape({});
    }

    const shape: Record<string, Yup.AnySchema> = {};
    step.fields.forEach((field) => {
        if (field.type === 'multi-text' || (field.type === 'select' && field.multiple)) {
            const itemSchema = field.type === 'multi-text'
                ? Yup.string()
                    .test(noLeadingOrTrailingWhitespace.test, `${field.label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
                    .test('no-multiple-whitespace', `${field.label} cannot contain consecutive blank spaces`, value => !value || !/\s{2,}/.test(value))
                    .test('not-only-whitespace', `${field.label} cannot be only blank space`, value => !value || !/^\s*$/.test(value))
                : Yup.string();
            let schema = Yup.array().of(itemSchema);
            if (field.required) {
                const msg = field.type === 'multi-text'
                    ? `Please add at least one ${field.label.toLowerCase()}`
                    : `Please select at least one ${field.label.toLowerCase()}`;
                schema = schema.required(msg).min(1, msg);
            }
            if (field.maxLength !== undefined) {
                schema = schema.max(field.maxLength, `Maximum ${field.maxLength} ${field.label.toLowerCase()} allowed`);
            }
            shape[field.name] = schema;
            return;
        }
        if (field.conditionalText) {
            const { dependsOnField, triggerValue } = field.conditionalText;
            const lowerLabel = field.label.toLowerCase();
            shape[field.name] = Yup.string().when(dependsOnField, {
                is: (val: string) => val === triggerValue,
                then: (s) => field.required ? s.required(`Please select ${lowerLabel}`) : s,
                otherwise: (s) => {
                    let textSchema = s
                        .test(noLeadingOrTrailingWhitespace.test, `${field.label} cannot start or end with a blank space`, noLeadingOrTrailingWhitespace.testFn)
                        .test('no-multiple-whitespace', `${field.label} cannot contain consecutive blank spaces`, value => !value || !/\s{2,}/.test(value))
                        .test('not-only-whitespace', `${field.label} cannot be only blank space`, value => !value || !/^\s*$/.test(value))
                        .min(3, `${field.label} must be at least 3 characters`)
                        .max(100, `Maximum 100 characters are allowed`);
                    if (field.required) textSchema = textSchema.required(`Please enter ${lowerLabel}`);
                    return textSchema;
                },
            });
            return;
        }
        if (field.dependsOn && field.required) {
            const { field: parentField, values: triggerValues } = field.dependsOn;
            const requiredMsg = field.type === 'select' || field.type === 'radio' || field.type === 'date' || field.type === 'time'
                ? `Please select ${field.label.toLowerCase()}`
                : `Please enter ${field.label.toLowerCase()}`;
            shape[field.name] = Yup.string().when(parentField, {
                is: (val: string | string[]) =>
                    Array.isArray(val) ? val.some(v => triggerValues.includes(v)) : triggerValues.includes(val),
                then: (s) => {
                    let schema = s.required(requiredMsg);
                    if (field.minValue !== undefined) {
                        schema = schema.test('min-value', `${field.label} must be at least ${field.minValue}`, value => (value === undefined || value === null || value === '') || Number(value) >= (field.minValue as number));
                    }
                    if (field.maxValue !== undefined) {
                        schema = schema.test('max-value', `${field.label} must be at most ${field.maxValue}`, value => (value === undefined || value === null || value === '') || Number(value) <= (field.maxValue as number));
                    }
                    return schema;
                },
                otherwise: (s) => s.notRequired(),
            });
        } else {
            shape[field.name] = getFieldSchema(field.name, field.label, field.required ?? false, field.type, field.allowAlphabetsAndSpaceOnly, field.allowNumbersOnly, field.minValue, field.minLength, field.maxLength, field.maxValue);
        }
    });

    const panFields = step.fields.filter(f => {
        if (f.type !== 'text') return false;
        const lower = f.name.toLowerCase();
        return (lower.startsWith('pan') || lower.endsWith('pan'))
            && !lower.includes('card')
            && !lower.includes('name');
    });

    panFields.forEach(field => {
        const s = shape[field.name] as Yup.StringSchema;
        if (!s) return;

        let augmented: Yup.StringSchema = s;

        const otherPans = panFields.filter(f => f.name !== field.name);
        if (otherPans.length > 0) {
            augmented = augmented.test(
                'pan-unique',
                'This PAN must be different from other PAN fields',
                function validatePanUnique(value) {
                    if (!value || value.length < 10) return true;
                    const conflict = otherPans.find(f => this.parent[f.name] === value);
                    if (conflict) {
                        return this.createError({
                            message: `${field.label} must be different from ${conflict.label}`,
                        });
                    }
                    return true;
                }
            );
        }

        shape[field.name] = augmented;
    });

    return Yup.object().shape(shape) as Yup.ObjectSchema<Record<string, unknown>>;
};
