import SelectInputWithSearchAndIcon from './SelectInputWithSearchAndIcon';
import { useCountries } from '../../hooks/useCountries';

interface SelectCountryInputProps {
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
}

export const SelectCountryInput = ({
    name = 'country',
    label = 'Select Country',
    required = false,
    placeholder = 'Select Country',
}: SelectCountryInputProps) => {
    const { countryOptions, countriesLoading } = useCountries('', '', 'is_active=true');
    return (
        <SelectInputWithSearchAndIcon
            label={label}
            options={countryOptions}
            name={name}
            placeholder={placeholder}
            loading={countriesLoading}
            isRequired={required}
        />
    );
};
