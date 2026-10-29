/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Flex, Form, Spin, Typography } from 'antd';
import { useField, useFormikContext } from 'formik';

import useSearchRenewalCompanies, { CompanyOption } from '../../hooks/useSearchRenewalCompanies';

interface Props {
    name?: string;
    onJurisdictionChange?: (j: {
        country?: string;
        company_type?: string;
        freezone?: string;
    }) => void;
    onRequestNewCompany?: () => void;
}

export default function CompanyAutocomplete({
    name = 'company',
    onJurisdictionChange,
    onRequestNewCompany,
}: Props) {
    const [field, meta] = useField(name);
    const { setFieldValue, setFieldTouched } = useFormikContext<any>();

    const [inputValue, setInputValue] = useState('');
    const { options, isLoading, debouncedQuery } = useSearchRenewalCompanies(inputValue);

    const dropdownOptions = useMemo(
        () =>
            options.map(o => ({
                value: o.value,
                label: o.label,
                data: o,
            })),
        [options]
    );

    const notFoundContent = isLoading ? (
        <Spin size="small" />
    ) : debouncedQuery.length < 3 ? (
        <span className="text-gray-400">Enter at least 3 characters to search</span>
    ) : (
        <Flex vertical align="center" gap={8} className="py-2">
            <Typography.Text type="secondary">No companies found</Typography.Text>
            {onRequestNewCompany && (
                <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<PlusOutlined />}
                    onMouseDown={e => {
                        // onMouseDown so it fires before AutoComplete's blur
                        // closes the dropdown and swallows the click.
                        e.preventDefault();
                        onRequestNewCompany();
                    }}
                >
                    Request for new company
                </Button>
            )}
        </Flex>
    );

    return (
        <Form.Item
            label="Company"
            required
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={meta.touched && meta.error ? meta.error : undefined}
        >
            <AutoComplete
                value={inputValue}
                options={dropdownOptions}
                placeholder="Search company name..."
                notFoundContent={notFoundContent}
                filterOption={false}
                onSearch={val => setInputValue(val)}
                onSelect={(value, option) => {
                    const { data } = option as unknown as { data: CompanyOption };
                    setFieldValue(name, value);
                    setFieldTouched(name, true);
                    setInputValue(data.label);
                    onJurisdictionChange?.({
                        country: data.country,
                        company_type: data.company_type,
                        freezone: data.freezone,
                    });
                }}
                onBlur={() => setFieldTouched(name, true)}
                onChange={val => {
                    setInputValue(val);
                    if (!val && field.value) {
                        setFieldValue(name, '');
                    }
                }}
            />
        </Form.Item>
    );
}
