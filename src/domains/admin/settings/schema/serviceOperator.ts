import * as Yup from 'yup';

import { alphabets } from '@utils/regex';

export const serviceOperatorSchema = Yup.object().shape({
    serviceProvider: Yup.string()
        .required('Please enter the service provider name')
        .matches(alphabets, 'Please enter valid vendor name')
        .min(3, 'Service provider name must be at least 3 characters'),
    balanceMethod: Yup.string().required('Please enter the balance method'),
    accessKey: Yup.string().required('Please enter the access key'),
    paymentclientid: Yup.string(),
    paymentclientsecret: Yup.string(),
    serviceCategory: Yup.string().required('Please select the service category'),
    vendorId: Yup.string().required('Please select the vendor'),
    serviceType: Yup.string().required('Please select the service type'),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string().required('Please select the commission type'),
    providerCommission: Yup.string().required('Please enter the provider commission'),
});
