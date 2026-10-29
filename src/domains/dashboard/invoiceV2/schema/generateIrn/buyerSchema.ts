import * as Yup from 'yup';

import { textField, withGstinValidation } from '../../utils/yupHelpers';

export const buyerSchema = Yup.object({
    buyerGstin: withGstinValidation(Yup.string().required('Please enter the buyer GSTIN')),
    legalName: textField('Legal name', 'Please enter the legal name'),
    tradeName: textField('Trade name', 'Please enter the trade name'),
    phoneNumber: Yup.string()
        .required('Please enter the phone number')
        .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    address1: textField('Address', 'Please enter the address'),
    location: textField('Location/City', 'Please enter the location/city'),
    pinCode: Yup.string().required('Please enter the PIN Code').matches(/^[1-9][0-9]{5}$/, 'Please enter a valid PIN Code'),
    state: Yup.string().required('Please select the state'),
    placeOfSupply: Yup.string().required('Please select the place of supply'),
});
