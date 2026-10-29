import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export const isPhoneValidByCountry = (phone: string, countryCode?: string | null) => {
    try {
        if (!phone) {
            return { isValid: true, error: null };
        }

        const parsed = countryCode
            ? phoneUtil.parseAndKeepRawInput(phone, countryCode.toUpperCase())
            : phoneUtil.parseAndKeepRawInput(phone);

        const isValid = phoneUtil.isValidNumber(parsed);

        return {
            isValid,
            error: isValid ? null : 'Invalid phone number for selected country',
        };
    } catch (error: any) {
        return {
            isValid: false,
            error: error?.message || 'Invalid phone number format',
        };
    }
};
