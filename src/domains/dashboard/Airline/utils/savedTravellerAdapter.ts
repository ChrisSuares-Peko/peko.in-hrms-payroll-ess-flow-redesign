import { SavedTravellerPayload, TravellerOption } from '@customtypes/savedTraveller';
import { cleanTravellerDate as cleanDate } from '@utils/travellerIdentity';

export { optionIdentityKey } from '@utils/travellerIdentity';

type SetFieldValue = (field: string, value: unknown) => void;

// Maps a canonical traveller option (employee OR saved) onto the airline passenger Formik fields.
// Employee options don't carry title/passportIssueDate/cellCountryCode/pan, so those are applied
// only when present — keeping employee autofill behaviour unchanged.
export const applyToAirlineForm = (
    setFieldValue: SetFieldValue,
    option: TravellerOption,
    getNamePrefix: (gender: number) => string,
    setGender: (gender: number) => void
) => {
    const nameParts = (option.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const genderNum = option.gender === 'MALE' ? 1 : 2;

    setFieldValue('FirstName', firstName);
    setFieldValue('LastName', lastName);
    setFieldValue('Gender', genderNum);
    setFieldValue('Title', getNamePrefix(genderNum));
    setFieldValue('DateOfBirth', option.dateOfBirth || '');
    setFieldValue('PassportNo', option.passportNo || '');
    setFieldValue('PassportExpiry', option.passportExpiryDate || '');
    setFieldValue('Email', option.email || '');
    setFieldValue('ContactNo', option.mobileNo || '');
    setFieldValue('AddressLine1', option.addressLine1 || '');
    setFieldValue('AddressLine2', option.addressLine2 || '');
    setFieldValue('City', option.city || '');

    if (option.title) setFieldValue('Title', option.title);
    if (option.passportIssueDate) setFieldValue('PassportIssueDate', option.passportIssueDate);
    if (option.cellCountryCode) setFieldValue('CellCountryCode', option.cellCountryCode);
    if (option.pan) setFieldValue('PAN', option.pan);

    setGender(genderNum);
};

// Picks the reusable identity fields from the airline Formik values into the canonical payload.
// Returns null when the minimum (first + last name) isn't present.
export const airlineValuesToSavedPayload = (
    values: Record<string, any>
): SavedTravellerPayload | null => {
    if (!values?.FirstName || !values?.LastName) return null;
    let gender = '';
    if (values.Gender === 1) gender = 'MALE';
    else if (values.Gender === 2) gender = 'FEMALE';
    return {
        title: values.Title || '',
        firstName: values.FirstName,
        lastName: values.LastName,
        gender,
        paxType: values.PaxType,
        dateOfBirth: cleanDate(values.DateOfBirth),
        passportNo: values.PassportNo ? String(values.PassportNo).toUpperCase() : '',
        passportExpiry: cleanDate(values.PassportExpiry),
        passportIssueDate: cleanDate(values.PassportIssueDate),
        passportIssueCountryCode: values.PassportIssueCountryCode || '',
        addressLine1: values.AddressLine1 || '',
        addressLine2: values.AddressLine2 || '',
        city: values.City || '',
        cellCountryCode: values.CellCountryCode || '',
        contactNo: values.ContactNo || '',
        email: values.Email || '',
        nationality: values.Nationality || '',
        countryCode: values.CountryCode || '',
        countryName: values.CountryName || '',
        pan: values.PAN || '',
    };
};
