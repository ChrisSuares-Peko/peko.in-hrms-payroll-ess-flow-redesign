import React, { useEffect, useMemo, useState } from 'react';

import { Form, Input, Select } from 'antd';
import { getIn, useFormikContext } from 'formik';
import {
    getCountries,
    getCountryCallingCode,
    parsePhoneNumberFromString,
    validatePhoneNumberLength,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

const isoToFlagEmoji = (isoCode: string): string =>
    isoCode
        .toUpperCase()
        .split('')
        .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
        .join('');

// Trim a national-digit string to the selected country's maximum valid length —
// libphonenumber-js reports 'TOO_LONG' once past it — so the input can't accept
// more digits than the country's format allows (was previously unrestricted).
const capToMaxLength = (digits: string, iso: CountryCode): string => {
    let capped = digits;

    while (capped.length > 0 && validatePhoneNumberLength(capped, iso) === 'TOO_LONG') {
        capped = capped.slice(0, -1);
    }

    return capped;
};

interface PhoneInputWithCountryProps {
    name: string;
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    defaultCountry?: CountryCode;
}

const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
    name,
    label,
    placeholder,
    isRequired,
    isDisabled,
    defaultCountry = 'IN',
}) => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<any>();
    const stored: string = getIn(values, name) || '';
    const error = getIn(errors, name);
    const isTouched = getIn(touched, name);

    // Track the selected country independently of the stored value.
    // `parsePhoneNumberFromString` returns null for partial input like `+9715`,
    // so deriving country from `stored` on every render would discard the
    // user's selection mid-typing. Instead, initialise from `stored` once,
    // then own the state ourselves.
    const [country, setCountry] = useState<CountryCode>(() => {
        const parsed = stored ? parsePhoneNumberFromString(stored) : null;
        return parsed?.country || defaultCountry;
    });

    // If `stored` changes externally (e.g. a draft loads after mount), and we
    // can confidently re-derive the country, sync it.
    useEffect(() => {
        if (!stored) return;
        const parsed = parsePhoneNumberFromString(stored);
        if (parsed?.country && parsed.country !== country) {
            setCountry(parsed.country);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stored]);

    const callingCode = getCountryCallingCode(country);

    // National digits = stored value minus the `+<callingCode>` prefix.
    // Computed (not parsed) so partial input like `+9715` still shows as `5`.
    const nationalDigits = stored.startsWith(`+${callingCode}`)
        ? stored.slice(callingCode.length + 1)
        : '';

    const countryOptions = useMemo(
        () =>
            getCountries()
                .map(code => ({
                    value: code,
                    code,
                    callingCode: getCountryCallingCode(code),
                }))
                .sort((a, b) => Number(a.callingCode) - Number(b.callingCode)),
        []
    );

    const handleCountryChange = (next: CountryCode) => {
        setCountry(next);
        const nextCallingCode = getCountryCallingCode(next);
        // Re-trim the carried-over number to the new country's max length.
        const digits = capToMaxLength(nationalDigits, next);
        const value = digits ? `+${nextCallingCode}${digits}` : `+${nextCallingCode}`;
        setFieldValue(name, value, true);
        setFieldTouched(name, true, false);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = capToMaxLength(e.target.value.replace(/\D/g, ''), country);
        const value = digits ? `+${callingCode}${digits}` : '';
        setFieldValue(name, value, true);
    };

    const countrySelect = (
        <Select
            value={country}
            disabled={isDisabled}
            showSearch
            optionLabelProp="label"
            style={{ width: 110 }}
            filterOption={(input, option) => {
                const search = String((option as any)?.searchField || '').toLowerCase();
                return search.includes(input.toLowerCase());
            }}
            options={countryOptions.map(opt => ({
                value: opt.value,
                label: (
                    <span>
                        <span style={{ marginRight: 6 }}>{isoToFlagEmoji(opt.code)}</span>+
                        {opt.callingCode}
                    </span>
                ),
                searchField: `${opt.code} +${opt.callingCode}`,
            }))}
            onChange={handleCountryChange}
        />
    );

    return (
        <Form.Item
            label={label && <span>{label}</span>}
            required={isRequired}
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? (error as React.ReactNode) : undefined}
        >
            <Input
                type="tel"
                value={nationalDigits}
                disabled={isDisabled}
                placeholder={placeholder}
                addonBefore={countrySelect}
                onChange={handleNumberChange}
                onBlur={() => setFieldTouched(name, true)}
            />
        </Form.Item>
    );
};

export default PhoneInputWithCountry;
