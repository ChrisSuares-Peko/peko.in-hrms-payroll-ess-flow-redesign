import { useEffect, useMemo, type ReactNode } from 'react';

import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { getIn, useField, useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
// import SelectInput from '@components/atomic/inputs/SelectInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';

import {
    DEFAULT_MAX_FILE_MB,
    FILE_ACCEPT,
    IMAGE_ACCEPT,
    getUploadHint,
} from './utils/uploadConstraints';
import { useFormTableById } from '../../hooks/useGetTableData';
import { IField, IForm } from '../../types/forms';
import { isConditionMet } from '../../utils/pathResolver';
import CustomFileUpload from '../atomic/CustomFileUpload';
import NestedSelectInput from '../atomic/NestedSelectInput';
import PhoneInputWithCountry from '../atomic/PhoneInputWithCountry';
import CustomRadio from '../atomic/RadioInput';
import { SelectCountryInput } from '../atomic/SelectCountryInput';
import SelectInputWithSearchAndIcon from '../atomic/SelectInputWithSearchAndIcon';
import TableSelectInput from '../atomic/TableSelect';

type FieldProps = {
    field: IField;
    pageId: string;
    sectionId: string;
    instanceIdx?: number;
    fieldIdx?: number;
    form: IForm;
};
export default function FieldRenderer({ field, pageId, sectionId, instanceIdx, form }: FieldProps) {
    const { values, setFieldValue, errors, touched } = useFormikContext<any>();
    const name =
        instanceIdx !== undefined
            ? `pages.${pageId}.${sectionId}.${instanceIdx}.${field.name}`
            : `pages.${pageId}.${sectionId}.${field.name}`;
    const [formikField, , helpers] = useField(name);

    const isSourceField =
        field.options_source_type === 'field' && Boolean(field.options_source_field_name);

    const sourceValues = useMemo<string[]>(() => {
        if (!isSourceField || !field.options_source_field_name) return [];

        // Accept both vendor path formats:
        //   pages.<pageIdx>.sections.<sectionIdx>.instances.<n>.fields.<fieldIdx>(.value)?
        //   sections.<sectionIdx>.instances.<n>.fields.<fieldIdx>(.value)?
        const m = field.options_source_field_name.match(
            /(?:pages\.(\d+)\.)?sections\.(\d+)\.instances\.\d+\.fields\.(\d+)/
        );
        if (!m) return [];

        const pageIndex = m[1] ? Number(m[1]) : 0;
        const sectionIndex = Number(m[2]);
        const fieldIndex = Number(m[3]);

        const sourcePage = form.pages?.[pageIndex];
        const sourcePageId = sourcePage?._id;
        const sourceSection = sourcePage?.sections?.[sectionIndex];
        const sourceSectionId = sourceSection?._id;
        const sourceFieldName = sourceSection?.fields?.[fieldIndex]?.name;

        if (!sourcePageId || !sourceSectionId || !sourceFieldName) return [];

        const sourceSectionData = values?.pages?.[sourcePageId]?.[sourceSectionId];
        if (!sourceSectionData || typeof sourceSectionData !== 'object') return [];

        const collected: string[] = [];
        Object.values(sourceSectionData).forEach((instance: any) => {
            const val = instance?.[sourceFieldName];
            if (val == null || val === '') return;
            const str = String(val).trim();
            if (str) collected.push(str);
        });
        return Array.from(new Set(collected));
    }, [isSourceField, field.options_source_field_name, form, values?.pages]);

    useEffect(() => {
        if (!isSourceField) return;
        const currentValue = getIn(values, name);

        if (field.allow_multiple) {
            const arr = Array.isArray(currentValue) ? currentValue : [];
            const filtered = arr.filter(v => sourceValues.includes(String(v)));
            if (filtered.length !== arr.length) {
                setFieldValue(name, filtered);
            }
        } else if (currentValue && !sourceValues.includes(String(currentValue))) {
            setFieldValue(name, '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSourceField, sourceValues.join('|'), name]);

    const { data, loading, fetchFormTableById } = useFormTableById();

    useEffect(() => {
        if (field.type === 'table' && field.table) {
            fetchFormTableById(field.table);
        }
    }, [field.type, field.table, fetchFormTableById]);

    interface TableColumnDef {
        key: string;
        label: string;
        type: string;
    }

    type TableRow = Record<string, string | number | null>;

    const tableColumns = useMemo<ColumnsType<TableRow>>(() => {
        if (!data?.columns?.length) return [];

        return data.columns.map((col: TableColumnDef) => ({
            title: col.label,
            dataIndex: col.key,
            key: col.key,
            ellipsis: true,
            render: (value: TableRow[keyof TableRow]) => value ?? '-',
        }));
    }, [data]);

    const tableData = useMemo<Array<TableRow & { key: React.Key }>>(() => {
        if (!data?.data?.length) return [];

        return data.data.map((row: TableRow, index: number) => ({
            key: row[data.primary_column] ?? index,
            ...row,
        }));
    }, [data]);

    const shouldRender = useMemo(
        () => isConditionMet(field.conditional, form, values, pageId, sectionId, instanceIdx),
        [field.conditional, values, pageId, sectionId, instanceIdx, form]
    );

    if (!shouldRender) {
        return null;
    }

    const commonProps = {
        name,
        value: formikField.value,
        onChange: (v: any) => helpers.setValue(v),
        onBlur: formikField.onBlur,
    };

    let fieldElement: ReactNode;

    switch (field.type) {
        case 'text':
        case 'email':
            fieldElement = (
                <TextInput
                    {...commonProps}
                    type="text"
                    label={field.label}
                    isRequired={field.validation.required.value}
                    placeholder={field.placeholder}
                />
            );
            break;

        case 'number':
            fieldElement = (
                <TextInput
                    name={name}
                    type="text"
                    label={field.label}
                    maxValue={field.validation.max?.value}
                    allowTwoDecimalsOnly
                    isRequired={field.validation.required.value}
                    placeholder={field.placeholder}
                />
            );
            break;

        case 'currency':
            fieldElement = (
                <TextInput
                    name={name}
                    type="text"
                    label={field.label}
                    prefix={field.currency || 'USD'}
                    maxValue={field.validation.max?.value}
                    allowTwoDecimalsOnly
                    isRequired={field.validation.required.value}
                    placeholder={field.placeholder}
                />
            );
            break;

        case 'textarea':
            fieldElement = (
                <InputTextArea
                    {...commonProps}
                    label={field.label}
                    placeholder={field.placeholder}
                    maxLength={field.validation.max_length?.value}
                    isRequired={field.validation.required.value}
                />
            );
            break;

        case 'checkbox':
            fieldElement = (
                <Flex vertical gap={6}>
                    <CheckboxInput
                        {...commonProps}
                        isRequired={field.validation.required.value}
                        checked={formikField.value === true}
                        onChange={e => helpers.setValue(e.target.checked)}
                    >
                        {field.label}
                    </CheckboxInput>
                </Flex>
            );
            break;

        case 'select': {
            let options = field.options || [];
            let hasOptions = true;

            if (isSourceField) {
                options = sourceValues.map(v => ({
                    label: v,
                    value: v,
                }));

                hasOptions = options.length > 0;
            }

            fieldElement = (
                <SelectInputWithSearchAndIcon
                    {...commonProps}
                    label={field.label}
                    isRequired={field.validation.required.value}
                    placeholder={field.placeholder}
                    options={options}
                    mode={field.allow_multiple ? 'multiple' : undefined}
                    notFoundContent={!hasOptions ? 'No items' : undefined}
                />
            );
            break;
        }

        case 'country':
            fieldElement = (
                <SelectCountryInput
                    {...commonProps}
                    label={field.label}
                    required={field.validation.required.value}
                    placeholder={field.placeholder}
                />
            );
            break;

        case 'date': {
            let datePickerProps: any = {};
            const validation = field.validation || {};

            if (validation.future_dates_only?.value) {
                datePickerProps = {
                    ...datePickerProps,
                    minDate: dayjs(),
                };
            } else if (validation.past_dates_only?.value) {
                datePickerProps = {
                    ...datePickerProps,
                    maxDate: dayjs(),
                };
            }

            // ✅ Minimum age restriction (DOB)
            if (validation.min_years_offset?.value) {
                const minYears = Number(validation.min_years_offset.value);

                if (!Number.isNaN(minYears) && minYears > 0) {
                    const maxDobDate = dayjs().subtract(minYears, 'year').endOf('day');

                    datePickerProps = {
                        ...datePickerProps,
                        maxDate: maxDobDate, // enforce DOB limit
                        defaultPickerValue: maxDobDate, // open picker near valid year
                    };
                }
            }

            fieldElement = (
                <DatePickerInput
                    {...commonProps}
                    classes="w-full"
                    placeholder={field.placeholder}
                    isRequired={field.validation.required.value}
                    label={field.label}
                    {...datePickerProps}
                />
            );
            break;
        }

        case 'file':
            fieldElement = (
                <CustomFileUpload
                    {...commonProps}
                    placeholder={field.placeholder}
                    label={field.label}
                    required={field.validation.required.value}
                    accept={FILE_ACCEPT}
                    maxSize={field?.validation.max_file_size?.value || DEFAULT_MAX_FILE_MB}
                    hint={getUploadHint('file', field?.validation.max_file_size?.value)}
                />
            );
            break;

        case 'radio':
            fieldElement = (
                <CustomRadio
                    name={name}
                    label={field.label}
                    required={field.validation.required.value}
                    options={field.options || []}
                    defaultValue={field.default_value}
                />
            );
            break;

        case 'image':
            fieldElement = (
                <CustomFileUpload
                    {...commonProps}
                    placeholder={field.placeholder}
                    label={field.label}
                    required={field.validation.required.value}
                    accept={IMAGE_ACCEPT}
                    maxSize={field?.validation.max_file_size?.value || DEFAULT_MAX_FILE_MB}
                    hint={getUploadHint('image', field?.validation.max_file_size?.value)}
                />
            );
            break;

        case 'phone':
            fieldElement = (
                <PhoneInputWithCountry
                    name={name}
                    label={field.label}
                    placeholder={field.placeholder}
                    isRequired={field.validation.required.value}
                />
            );
            break;

        case 'table':
            fieldElement = (
                <TableSelectInput
                    name={name}
                    label={field.label}
                    isRequired={field.validation.required.value}
                    placeholder={field.placeholder}
                    columns={tableColumns}
                    dataSource={tableData}
                    primaryKey={data?.primary_column}
                    loading={loading}
                />
            );
            break;

        case 'nested_select':
            // NestedSelectInput renders description internally
            return (
                <NestedSelectInput
                    name={name}
                    label={field.label}
                    required={field.validation.required.value}
                    description={field.description}
                    tableId={field.table}
                    levels={field.levels ?? []}
                    allowMultiple={field.allow_multiple}
                />
            );

        default:
            fieldElement = (
                <TextInput
                    isRequired={field.validation.required.value}
                    type="text"
                    {...commonProps}
                />
            );
    }

    const hasError = !!(getIn(touched, name) && getIn(errors, name));
    const showDescription = !!(field.description && !hasError);
    const textareaMaxLength =
        field.type === 'textarea' ? field.validation.max_length?.value : undefined;
    const showCount = textareaMaxLength !== undefined;
    // When textarea has error + count, hide Form.Item's internal error and render it ourselves
    // so the error text and count share the same line (same as description + count layout)
    const ownErrorRendering = showCount && hasError;
    const showFooter = showDescription || showCount;

    return (
        <Flex vertical style={{ width: '100%' }}>
            <Flex
                vertical
                className={[
                    showFooter ? '[&_.ant-form-item]:!mb-0' : '',
                    ownErrorRendering ? '[&_.ant-form-item-explain]:!hidden' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                {fieldElement}
            </Flex>
            {showFooter && (
                <Typography.Text
                    type="secondary"
                    style={{
                        fontSize: 12,
                        lineHeight: '1.5',
                        display: 'block',
                        marginTop: 4,
                        marginBottom: 8,
                        textAlign: 'justify',
                    }}
                >
                    {showCount && (
                        <span style={{ float: 'right', marginLeft: 8 }}>
                            {String(formikField.value || '').length} / {textareaMaxLength}
                        </span>
                    )}
                    {ownErrorRendering ? (
                        <span style={{ color: '#ff4d4f' }}>{getIn(errors, name)}</span>
                    ) : (
                        showDescription && field.description
                    )}
                </Typography.Text>
            )}
        </Flex>
    );
}
