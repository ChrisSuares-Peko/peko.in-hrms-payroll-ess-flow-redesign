import * as Yup from 'yup';

import { billPayments } from './data';
import { CustomerParam, CustomerValuesType } from '../types/index';

// Traffic Challan is a Droom product, not a BBPS biller: its beneficiary has no service-provider step,
// only a nickname + vehicle registration number saved as a single `vehicleNumber` customer param —
// the same shape the Traffic Challan page's own drawer stores.
export const CHALLAN_VEHICLE_PARAM: CustomerParam = {
    paramName: 'vehicleNumber',
    dataType: 'ALPHANUMERIC',
    minLength: 4,
    maxLength: 15,
    isOptional: 'false',
    regEx: '',
    values: null,
    visibility: true,
};

export const CHALLAN_VEHICLE_LABEL = 'Vehicle Registration Number';

export const challanVehicleNumberSchema = Yup.string()
    .required('Please enter the vehicle number')
    .matches(/^[A-Za-z0-9]{4,15}$/, 'Enter a valid vehicle number');

export const beneficiaryServiceOptions = billPayments
    .map(payment => ({ value: payment.accessKey, label: payment.title }))
    .sort((a, b) => a.label.localeCompare(b.label));

// Build minimal field definitions from a beneficiary's saved customerParams so the inputs can render
// (and show their saved values) even when the provider isn't on the currently-loaded biller page.
// Loose validation here is acceptable: the values were already valid when saved, and the real
// definitions take over the moment the user re-selects a provider.
export const deriveParamsFromSaved = (saved?: CustomerValuesType[]): CustomerParam[] =>
    (saved ?? [])
        .map(param => {
            const paramName = param.name ?? param.paramName;
            if (!paramName) return null;
            return {
                paramName,
                values: param.value ?? param.paramValue ?? null,
                isOptional: 'true',
                maxLength: 0,
                minLength: 0,
                dataType: '',
                regEx: '',
                visibility: true,
            } as CustomerParam;
        })
        .filter((param): param is CustomerParam => param !== null);

export const formatParamLabel = (text: string) =>
    text
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
        .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first letter
        .replace(/\b(id)\b/i, 'ID'); // Make 'id' into 'ID'
