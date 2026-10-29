import { SavedTravellerPayload, TravellerOption } from '@customtypes/savedTraveller';
import { cleanTravellerDate } from '@utils/travellerIdentity';

type SetFieldValue = (field: string, value: unknown) => void | Promise<unknown>;

export const optionToHotelPatch = (option: TravellerOption): Record<string, unknown> => {
    const nameParts = (option.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const patch: Record<string, unknown> = {
        firstName,
        lastName,
        gender: option.gender === 'MALE' ? 'M' : 'F',
        dob: option.dateOfBirth || '',
        email: option.email || '',
        phone: option.mobileNo || '',
    };
    if (option.passportNo) patch.passportNo = option.passportNo;
    if (option.passportIssueDate) patch.passportIssueDate = option.passportIssueDate;
    if (option.passportExpiryDate) patch.passportExpDate = option.passportExpiryDate;
    if (option.pan) patch.pan = option.pan;
    return patch;
};

export const applyToHotelForm = (setFieldValue: SetFieldValue, option: TravellerOption) => {
    Object.entries(optionToHotelPatch(option)).forEach(([field, value]) => setFieldValue(field, value));
};

export const hotelValuesToSavedPayload = (
    values: Record<string, any>
): SavedTravellerPayload | null => {
    if (!values?.firstName || !values?.lastName) return null;
    let gender = '';
    if (values.gender === 'M') gender = 'MALE';
    else if (values.gender === 'F') gender = 'FEMALE';
    return {
        firstName: values.firstName,
        lastName: values.lastName,
        gender,
        paxType: values.passengerType === 'adult' ? 1 : 2,
        dateOfBirth: cleanTravellerDate(values.dob),
        passportNo: values.passportNo ? String(values.passportNo).toUpperCase() : '',
        passportExpiry: cleanTravellerDate(values.passportExpDate),
        passportIssueDate: cleanTravellerDate(values.passportIssueDate),
        contactNo: values.phone || '',
        email: values.email || '',
        pan: values.pan || '',
    };
};
