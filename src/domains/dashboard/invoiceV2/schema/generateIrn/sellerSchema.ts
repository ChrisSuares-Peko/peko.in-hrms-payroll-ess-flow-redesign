import * as Yup from 'yup';

import { textField, withGstinValidation } from '../../utils/yupHelpers';

export const sellerSchema = Yup.object({
    sellerGstin: withGstinValidation(Yup.string().required('Please enter the seller GSTIN')),
    legalName: textField('Legal name', 'Please enter the legal name'),
    tradeName: textField('Trade name', 'Please enter the trade name'),
    address1: textField('Address', 'Please enter the address'),
    location: textField('Location/City', 'Please enter the location/city'),
    pinCode: Yup.string().required('Please enter the PIN Code').matches(/^[1-9][0-9]{5}$/, 'Please enter a valid PIN Code'),
    state: Yup.string().required('Please select the state'),
});
