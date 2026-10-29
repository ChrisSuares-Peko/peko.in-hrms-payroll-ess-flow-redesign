import React, { useEffect, useRef, useState } from 'react';

import { AutoComplete, Form } from 'antd';
import { getIn, useFormikContext } from 'formik';

import { ALL_INDIA_CITIES, CITIES_BY_STATE, INDIAN_STATES } from '@utils/indianLocations';

interface CityAutoCompleteInputProps {
    name: string;
    stateFieldName: string;
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    classes?: string;
}

const CityAutoCompleteInput: React.FC<CityAutoCompleteInputProps> = ({
    name,
    stateFieldName,
    label,
    placeholder = 'Enter City',
    isRequired,
    isDisabled,
    classes,
}) => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<any>();
    const [searchText, setSearchText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const isFirstRender = useRef(true);

    const stateVal = getIn(values, stateFieldName) as string | undefined;
    const cityVal = getIn(values, name) as string;
    const fieldError = getIn(errors, name);
    const fieldTouched = getIn(touched, name);

    const matchedState = stateVal
        ? INDIAN_STATES.find(
              s =>
                  s.iso2 === stateVal ||
                  s.name === stateVal ||
                  s.name.toLowerCase() === stateVal.toLowerCase()
          )
        : undefined;

    const cityPool = matchedState ? (CITIES_BY_STATE[matchedState.iso2] ?? ALL_INDIA_CITIES) : ALL_INDIA_CITIES;

    const sanitizeCityInput = (val: string) =>
        val
            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
            .replace(/[^a-zA-Z ]/g, '');

    const filtered = (() => {
        const lowerSearch = searchText.toLowerCase();
        if (matchedState) {
            if (!isFocused && !searchText) return [];
            return [...new Set(cityPool.filter(c => !searchText || c.toLowerCase().startsWith(lowerSearch)))]
                .sort((a, b) => a.localeCompare(b))
                .map(c => ({ value: c }));
        }
        if (!searchText) return [];
        return [...new Set(cityPool.filter(c => c.toLowerCase().startsWith(lowerSearch)))]
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 100)
            .map(c => ({ value: c }));
    })();

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setFieldValue(name, '');
        setSearchText('');
    }, [stateVal]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Form.Item
            label={label && <span title="">{label}</span>}
            colon={false}
            required={isRequired}
            validateStatus={fieldTouched && fieldError ? 'error' : ''}
            help={fieldTouched && fieldError ? (fieldError as React.ReactNode) : undefined}
        >
            <AutoComplete
                value={cityVal}
                options={filtered}
                placeholder={placeholder}
                disabled={isDisabled}
                className={classes}
                filterOption={false}
                onFocus={() => setIsFocused(true)}
                onSearch={val => setSearchText(sanitizeCityInput(val))}
                onSelect={() => { setSearchText(''); setIsFocused(false); }}
                onChange={val => {
                    setFieldValue(name, sanitizeCityInput(val ?? ''));
                    setFieldTouched(name, true);
                }}
                onBlur={() => { setIsFocused(false); setFieldTouched(name, true); }}
            />
        </Form.Item>
    );
};

export default CityAutoCompleteInput;
