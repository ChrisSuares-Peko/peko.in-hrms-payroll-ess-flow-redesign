import React from 'react';

import { Checkbox, Form, Input } from 'antd';
import { Field, FieldProps, getIn, useField } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import MultiSelectInput from '@src/components/atomic/inputs/MultiSelectInput';
import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import RepeatableTable from './RepeatableTable';
import useIndianStates from '../../hooks/useIndianStates';
import type { FieldDef } from '../../types/formConfig';

function generateFinancialYears() {
    const currentYear = new Date().getFullYear();
    const years: { label: string; value: string }[] = [];
    for (let y = currentYear - 5; y <= currentYear + 2; y += 1) {
        const label = `${y}-${String(y + 1).slice(-2)}`;
        years.push({ label, value: label });
    }
    return years;
}

const financialYearOptions = generateFinancialYears();

interface Props {
    field: FieldDef;
    isRejected?: boolean;
}

const removeEmojis = (str: string) =>
    str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

const CheckboxField: React.FC<{ field: FieldDef }> = ({ field }) => {
    const [, meta, helpers] = useField<boolean>(field.key);
    return (
        <Form.Item validateStatus={meta.error && meta.touched ? 'error' : ''} help={meta.touched ? meta.error : undefined} className="!mb-0">
            <Checkbox checked={!!meta.value} onChange={e => helpers.setValue(e.target.checked)}>
                {field.label}
            </Checkbox>
        </Form.Item>
    );
};

const TextAreaField: React.FC<{ field: FieldDef }> = ({ field }) => (
    <Field name={field.key}>
        {({ field: f, form: { touched, errors, setFieldValue } }: FieldProps) => (
            <Form.Item
                label={field.label}
                required={field.required}
                validateStatus={getIn(touched, field.key) && getIn(errors, field.key) ? 'error' : ''}
                help={getIn(touched, field.key) && getIn(errors, field.key) ? (getIn(errors, field.key) as React.ReactNode) : undefined}
            >
                <Input.TextArea
                    {...f}
                    placeholder={field.placeholder ?? (field.label ? `Enter ${field.label.toLowerCase()}` : undefined)}
                    maxLength={field.maxLength}
                    autoSize={{ minRows: field.minRows ?? 3 }}
                    showCount={!!field.maxLength}
                    onChange={e => {
                        let val = removeEmojis(e.target.value);
                        if (field.allowAlphabetsAndNumbersOnly) val = val.replace(/[^a-zA-Z0-9]/g, '');
                        if (field.allowAlphabetsSpaceAndNumbers) val = val.replace(/[^a-zA-Z0-9 ]/g, '');
                        setFieldValue(field.key, val);
                    }}
                />
            </Form.Item>
        )}
    </Field>
);

const rejectedClass = 'rejected-field';

const DynamicFieldRenderer: React.FC<Props> = ({ field, isRejected }) => {
    const { stateOptions, isLoading: statesLoading } = useIndianStates();

    if (field.type === 'date') {
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <DatePickerInput
                    name={field.key}
                    label={field.label}
                    placeholder={field.placeholder ?? (field.label ? `Select ${field.label.toLowerCase()}` : '')}
                    isRequired={field.required}
                    classes="w-full"
                    formItemClass="w-full"
                />
            </div>
        );
    }

    if (field.type === 'multiselect') {
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <MultiSelectInput
                    name={field.key}
                    label={field.label}
                    placeholder={field.placeholder ?? (field.label ? `Select ${field.label.toLowerCase()}` : '')}
                    options={field.options ?? []}
                    isRequired={field.required}
                />
            </div>
        );
    }

    if (field.type === 'select') {
        let options = field.options ?? [];
        if (field.optionsSource === 'indianStates') options = stateOptions;
        else if (field.optionsSource === 'financialYears') options = financialYearOptions;
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <SelectInputWithSearch
                    name={field.key}
                    label={field.label}
                    placeholder={field.placeholder ?? (field.label ? `Select ${field.label.toLowerCase()}` : '')}
                    options={options}
                    isRequired={field.required}
                    loading={field.optionsSource === 'indianStates' ? statesLoading : false}
                    classes="w-full"
                />
            </div>
        );
    }

    if (field.type === 'checkbox') {
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <CheckboxField field={field} />
            </div>
        );
    }

    if (field.type === 'note') {
        return (
            <div className="col-span-2 w-full bg-[#fffbe6] border border-[#ffe58f] rounded-lg px-4 py-2.5 text-[12px] text-[rgba(0,0,0,0.65)] leading-relaxed">
                <span className="font-semibold">Note: </span>{field.description}
            </div>
        );
    }

    if (field.type === 'repeatable-table') {
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <RepeatableTable field={field} />
            </div>
        );
    }

    if (field.type === 'textarea') {
        return (
            <div className={isRejected ? rejectedClass : undefined}>
                <TextAreaField field={field} />
            </div>
        );
    }

    return (
        <div className={isRejected ? rejectedClass : undefined}>
            <TextInput
                name={field.key}
                label={field.label}
                type={field.type === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder ?? (field.label ? `Enter ${field.label.toLowerCase()}` : undefined)}
                isRequired={field.required}
                maxLength={field.maxLength}
                convertToUppercase={field.convertToUppercase}
                allowNumbersOnly={field.allowNumbersOnly || field.type === 'number' || field.type === 'phone'}
                allowTwoDecimalsOnly={field.allowTwoDecimalsOnly}
                allowAlphabetsAndSpaceOnly={field.allowAlphabetsAndSpace}
                allowAlphabetsAndNumbersOnly={field.allowAlphabetsAndNumbersOnly}
                allowAlphabetsSpaceAndNumbersOnly={field.allowAlphabetsSpaceAndNumbers}
                allowAlphabetsNumberAndSpecialCharacters={
                    field.allowAlphabetsNumberAndSpecialCharacters
                        ? [' ', ...field.allowAlphabetsNumberAndSpecialCharacters.filter(c => c !== ' ')]
                        : undefined
                }
                addonBefore={field.addonBefore}
            />
        </div>
    );
};

export default DynamicFieldRenderer;
