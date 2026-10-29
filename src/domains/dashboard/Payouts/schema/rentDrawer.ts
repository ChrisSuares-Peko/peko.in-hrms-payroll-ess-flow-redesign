import * as Yup from 'yup';

import { nameValidation } from './validations';

export const rentInitialValues = {
    beneficiary: '',
    landlordName: '',
    propertyAddress: '',
    rentPeriod: '',
    dueDate: '',
    rentAmount: '',
    maintenanceCharges: '',
    leaseAgreementNumber: '',
    notes: '',
    attachment: '',
};

export const rentValidationSchema = Yup.object({
    beneficiary: Yup.string().required('Please select the beneficiary'),
    landlordName: nameValidation('Please enter the landlord name', 'Landlord name'),
    propertyAddress: nameValidation('Please enter the property address', 'Property address'),
    rentPeriod: Yup.string().required('Please select the rent period'),
    dueDate: Yup.string().required('Please select the due date'),
    rentAmount: Yup.string()
        .required('Please enter rent amount')
        .test('greater-than-zero', 'Rent amount must be greater than 0', value => !value || parseFloat(value) > 0),
});
