import { useEffect } from 'react';

import { Form, Input } from 'antd';
import { useField, useFormikContext } from 'formik';

import { useCountries } from '../../hooks/useCountries';
import SelectInputWithSearchAndIcon from '../atomic/SelectInputWithSearchAndIcon';

interface Props {
    onJurisdictionChange?: (j: {
        country?: string;
        company_type?: string;
        freezone?: string;
    }) => void;
    onFreezoneAvailabilityChange?: (hasFreezone: boolean) => void;
}

export default function ExternalCompanyFields({
    onJurisdictionChange,
    onFreezoneAvailabilityChange,
}: Props) {
    const [nameField, nameMeta, nameHelpers] = useField('external_company.name');
    const { values, setFieldValue } = useFormikContext<any>();

    const country = values?.external_company?.country ?? '';
    const company_type = values?.external_company?.company_type ?? '';
    const freezone = values?.external_company?.freezone ?? '';

    const {
        countryOptions,
        companyOptions,
        freezoneOptions,
        countriesLoading,
        companyLoading,
        freezoneLoading,
    } = useCountries(country, company_type);

    useEffect(() => {
        onJurisdictionChange?.({ country, company_type, freezone });
    }, [country, company_type, freezone, onJurisdictionChange]);

    useEffect(() => {
        onFreezoneAvailabilityChange?.(freezoneOptions.length > 0);
    }, [freezoneOptions, onFreezoneAvailabilityChange]);

    // Reset dependent selects when parent changes.
    useEffect(() => {
        if (!country && company_type) setFieldValue('external_company.company_type', '');
        if (!country && freezone) setFieldValue('external_company.freezone', '');
    }, [company_type, country, freezone, setFieldValue]);

    useEffect(() => {
        if (!company_type && freezone) setFieldValue('external_company.freezone', '');
    }, [company_type, freezone, setFieldValue]);

    return (
        <div className="flex flex-col gap-2">
            <Form.Item
                label="Company Name"
                required
                validateStatus={nameMeta.touched && nameMeta.error ? 'error' : ''}
                help={nameMeta.touched && nameMeta.error ? nameMeta.error : undefined}
            >
                <Input
                    {...nameField}
                    placeholder="Enter company name"
                    onChange={e => nameHelpers.setValue(e.target.value)}
                    onBlur={() => nameHelpers.setTouched(true)}
                />
            </Form.Item>

            <SelectInputWithSearchAndIcon
                label="Country"
                name="external_company.country"
                placeholder="Select Country"
                options={countryOptions}
                loading={countriesLoading}
                isRequired
            />

            <SelectInputWithSearchAndIcon
                label="Company Type"
                name="external_company.company_type"
                placeholder="Select Company Type"
                options={companyOptions}
                loading={companyLoading}
                isRequired
                isDisabled={!country || companyOptions.length === 0}
            />

            {(freezoneOptions?.length ?? 0) > 0 && (
                <SelectInputWithSearchAndIcon
                    label="Free Zone"
                    name="external_company.freezone"
                    placeholder="Select Free Zone"
                    options={freezoneOptions}
                    loading={freezoneLoading}
                    isRequired
                    isDisabled={!company_type}
                />
            )}
        </div>
    );
}
