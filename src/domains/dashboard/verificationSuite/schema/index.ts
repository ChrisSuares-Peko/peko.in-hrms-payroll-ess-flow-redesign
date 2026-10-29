import * as Yup from 'yup';

import { InputComponentsType } from '../types';

export const generateYupSchema = (inputComponents: InputComponentsType[] | undefined) => {
    const yupObject: any = {};

    inputComponents?.forEach(field => {
        const { label, max, min, name, type, required } = field;
        const fieldName = name;

        const fieldLabel = label === 'Name' ? 'name' : label;

        // Handling input type fields
        if (type === 'input') {
            // Example: PAN number
            if (fieldName === 'pan' || fieldName === 'pan_no') {
                yupObject[fieldName] = Yup.string()
                    .min(10, `PAN must be 10 characters`)
                    .required(`Please enter the ${fieldLabel}`)
                    .matches(/^\S*$/, 'PAN must not contain spaces')
                    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN');
            }
            // Example: Name
            else if (fieldName === 'name') {
                let nameSchema = Yup.string()
                    .min(min || 3, `Name must be at least ${min} characters`)
                    .max(max || 50, `Name cannot exceed ${max} characters`)
                    .test(
                        'no-leading-whitespace',
                        'Name cannot start with whitespace',
                        (value: any) => !/^\s/.test(value) // Check if starts with whitespace
                    )
                    .test(
                        'no-multiple-whitespace',
                        'Name cannot contain consecutive whitespaces',
                        (value: any) => !/\s{2,}/.test(value)
                    ) // No consecutive spaces
                    .test(
                        'not-only-whitespace',
                        'Name cannot be only whitespace',
                        (value: any) => !/^\s*$/.test(value)
                    );

                if (required) {
                    nameSchema = nameSchema.required(`Please enter the ${fieldLabel}`);
                }

                yupObject[fieldName] = nameSchema;
            }
            // Example: Account Number
            else if (fieldName === 'bank_account') {
                yupObject[fieldName] = Yup.string()
                    .min(9, 'Account number must be at least 9 digits')
                    .max(max, `${fieldLabel} cannot exceed ${max} digits`)
                    .required(`Please enter the account number`);
            }

            // Example: Reference Number
            else if (fieldName === 'reference_number') {
                yupObject[fieldName] = Yup.string()
                    .min(min || 3, `Reference number must be at least ${min} characters`)
                    .max(max || 20, `Reference number cannot exceed ${max} characters`)
                    .required(`Please enter the reference number`);
            }

            // Example: Phone Number
            else if (fieldName === 'phone') {
                yupObject[fieldName] = Yup.string()
                    .min(min, `Mobile number must be 10 digits`)
                    .matches(/^[0-9]{10,11}$/, 'Invalid mobile number');
                // .required(`Please enter the phone number`);
            }
            // Example: Mobile Number
            else if (fieldName === 'mobile') {
                let mobileSchema = Yup.string().matches(/^[0-9]{10}$/, 'Invalid mobile number');
                if (required) {
                    mobileSchema = mobileSchema.required(`Please enter the ${fieldLabel}`);
                }
                yupObject[fieldName] = mobileSchema;
            }
            // Example: Email
            else if (fieldName === 'email') {
                let emailSchema = Yup.string().matches(
                    /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    'Invalid email address'
                );
                if (required) {
                    emailSchema = emailSchema.required(`Please enter the ${fieldLabel}`);
                }
                yupObject[fieldName] = emailSchema;
            }
            // Example: IFSC
            else if (fieldName === 'ifsc') {
                yupObject[fieldName] = Yup.string()
                    .min(11, 'IFSC code must be 11 characters')
                    .max(11, 'IFSC Code cannot exceed 11 characters')
                    .matches(/^[A-Z0-9]+$/, 'IFSC code must be alphanumeric and uppercase')
                    .required(`Please enter the IFSC code`);
            }
            // Example: Driving License Number
            else if (fieldName === 'dl_number') {
                yupObject[fieldName] = Yup.string()
                    .matches(
                        /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/,
                        'Please enter the valid license number.'
                    )
                    .required(`Please enter the license number`);
            }
            // Example: Voter ID (Epic Number)
            else if (fieldName === 'epic_number') {
                yupObject[fieldName] = Yup.string()
                    .min(10, 'Voter ID/EPIC number must be 10 characters')
                    .max(10, 'Voter ID/EPIC number must be 10 characters')
                    .matches(/^[A-Z]{3}[0-9]{7}$/, 'Invalid EPIC number')
                    .required(`Please enter the voter ID/EPIC number`);
            } else if (fieldName === 'file_number') {
                yupObject[fieldName] = Yup.string()
                    .min(12, 'File number must be at least 12 characters')
                    .max(17, 'File number must be at most 17 characters')
                    .matches(/^[A-Z]{2}[0-9]{13}$/, 'Invalid file number')
                    .required(`Please enter the file number`);
            } else if (fieldName === 'GSTIN') {
                yupObject[fieldName] = Yup.string()

                    .min(15, 'GSTIN must be 15 characters')
                    .max(15, 'GSTIN must be 15 characters')
                    .matches(
                        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                        'Invalid GSTIN'
                    )
                    .required(`Please enter the GSTIN`);
            } else if (fieldName === 'business_name') {
                yupObject[fieldName] = Yup.string()
                    .min(min || 3, `Business name must be at least 3 characters`)
                    .max(max || 50, `${fieldLabel} cannot exceed ${max} characters`)
                    .test(
                        'no-leading-whitespace',
                        'Business name cannot start with whitespace',
                        (value: any) => !/^\s/.test(value)
                    )
                    .test(
                        'no-multiple-whitespace',
                        'Business name cannot contain consecutive whitespaces',
                        (value: any) => !/\s{2,}/.test(value)
                    )
                    .test(
                        'not-only-whitespace',
                        'Business name cannot be only whitespace',
                        (value: any) => !/^\s*$/.test(value)
                    )
                    .test(
                        'strict-alphanumeric',
                        'Business name can only contain letters, numbers, and spaces',
                        (value: any) => /^[a-zA-Z0-9\s]*$/.test(value || '')
                    );
            } else if (fieldName === 'cin') {
                yupObject[fieldName] = Yup.string()
                    .min(21, 'CIN must be 21 characters')
                    .max(21, 'CIN must be 21 characters')
                    .matches(/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, 'Invalid CIN')
                    .required(`Please enter the CIN`);
            } else if (fieldName === 'din') {
                yupObject[fieldName] = Yup.string()
                    .min(8, 'DIN must be 8 digits')
                    .max(8, 'DIN must be 8 digits')
                    // .matches(/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, 'Invalid DIN')
                    .required(`Please enter the ${fieldLabel}`);
            } else if (fieldName === 'aadhaar_number') {
                yupObject[fieldName] = Yup.string()
                    .min(12, 'Aadhaar number must be 12 digits')
                    .max(12, 'Aadhaar number must be 12 digits')
                    .matches(/^\d{12}$/, 'Invalid Adhar number')
                    .required(`Please enter the ${fieldLabel}`);
            }
        } else if (type === 'dropdown') {
            if (fieldName === 'fy') {
                yupObject[fieldName] = Yup.string()
                    // .min(min || 3, `Name must be at least ${min} characters`)
                    // .max(max || 50, `Name cannot exceed ${max} characters`);
                    .required(`Please select the financial year`);
            }
        }
        // Handling select type fields
        else if (type === 'select') {
            if (fieldName === 'state_code') {
                yupObject[fieldName] = Yup.string().required('Please select the state');
            }
        } else if (type === 'fileUpload') {
            if (fieldName === 'image') {
                yupObject[fieldName] = Yup.mixed().required(`Please upload a file`);
            }
        } else if (fieldName === 'dob' || fieldName === 'date_of_birth') {
            yupObject[fieldName] = Yup.string()

                .required(`Please select the date of birth`);
        }
    });

    return Yup.object().shape(yupObject);
};
