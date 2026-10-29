import * as Yup from 'yup';

import { nameValidation, optionalNameValidation, panValidation, addressValidation, phoneValidation } from './validations';

export const individualInitialValues = {
    fullName: '',
    email: '',
    phoneNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
    panNumber: '',
    address: '',
};

export const businessInitialValues = {
    businessName: '',
    email: '',
    phoneNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    upiId: '',
    panNumber: '',
    address: '',
};

export const individualValidationSchema = Yup.object({
    fullName: nameValidation('Please enter the full name', 'Full name'),
    email: Yup.string().optional().email('Please enter a valid email ID'),
    phoneNumber: phoneValidation,
    accountNumber: Yup.string().required('Please enter the account number').matches(/^\d{9,18}$/, 'Account number must be between 9 to 18 digits'),
    ifscCode: Yup.string().required('Please enter the IFSC code').length(11, 'IFSC code must be 11 characters').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC Code'),
    bankName: optionalNameValidation('Bank name'),
    branchName: optionalNameValidation('Branch name'),
    panNumber: panValidation,
    address: addressValidation,
});

export const businessValidationSchema = Yup.object({
    businessName: nameValidation('Please enter the business name', 'Business name'),
    email: Yup.string().optional().email('Please enter a valid business email ID'),
    phoneNumber: phoneValidation,
    accountNumber: Yup.string().required('Please enter the account number'),
    ifscCode: Yup.string().required('Please enter the IFSC code').length(11, 'IFSC code must be 11 characters').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC Code'),
    bankName: optionalNameValidation('Bank name'),
    branchName: optionalNameValidation('Branch name'),
    panNumber: panValidation,
    address: addressValidation,
});
