import React, { useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Flex, Input, Typography } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

const MAX_TLDS = 6;

interface TldFormValues {
    tlds: string[];
}

const TldInput: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<TldFormValues>();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        // Strip leading dot, lowercase, allow a-z 0-9 and dot only
        setInputValue(
            e.target.value
                .replace(/^\./, '')
                .toLowerCase()
                .replace(/[^a-z0-9.]/g, '')
        );
    };

    const handleAdd = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        if (values.tlds.length >= MAX_TLDS) {
            setError(`Maximum ${MAX_TLDS} TLDs allowed`);
            return;
        }
        if (values.tlds.includes(trimmed)) {
            setError('Duplicate TLD not allowed');
            return;
        }
        if (!/^[a-z0-9.]+$/.test(trimmed)) {
            setError('Only lowercase letters, numbers and dots allowed');
            return;
        }

        setFieldValue('tlds', [...values.tlds, trimmed]);
        setInputValue('');
        setError('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (value: string) => {
        setFieldValue(
            'tlds',
            values.tlds.filter(v => v !== value)
        );
    };

    return (
        <div>
            {values.tlds.length === 0 ? (
                <Flex
                    align="center"
                    justify="center"
                    className="w-full py-8 mb-5 rounded-xl border border-dashed border-gray-200 bg-gray-50"
                >
                    <Text type="secondary" className="text-sm">
                        No TLDs added yet
                    </Text>
                </Flex>
            ) : (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {values.tlds.map(value => (
                        <Flex
                            key={value}
                            align="center"
                            justify="space-between"
                            className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                            <Text className="text-base font-semibold text-gray-800">.{value}</Text>
                            <CloseOutlined
                                className="text-xs text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                                onClick={() => handleRemove(value)}
                            />
                        </Flex>
                    ))}
                </div>
            )}

            <Input
                value={inputValue}
                placeholder="Type a TLD (e.g. com, co.in) and press Enter"
                status={error ? 'error' : undefined}
                prefix={<Text className="text-gray-400 text-sm">.</Text>}
                disabled={values.tlds.length >= MAX_TLDS}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {error && (
                <Text type="danger" className="block mt-1 text-xs">
                    {error}
                </Text>
            )}
            <Text type="secondary" className="block mt-2 text-xs">
                Type a TLD without the leading dot and press{' '}
                <kbd className="px-1 border rounded text-xs">Enter</kbd> to add.
            </Text>
        </div>
    );
};

export default TldInput;
