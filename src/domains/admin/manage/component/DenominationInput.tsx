import React, { useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Flex, Input, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { formatNumberWithLocalString } from '@utils/priceFormat';

const { Text } = Typography;

const MAX_DENOMINATIONS = 6;

interface DenominationFormValues {
    denominations: string[];
}

const DenominationInput: React.FC = () => {
    const { values, setFieldValue } = useFormikContext<DenominationFormValues>();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const sorted = [...values.denominations].sort((a, b) => Number(a) - Number(b));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        setInputValue(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
    };

    const handleAdd = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        if (values.denominations.length >= MAX_DENOMINATIONS) {
            setError(`Maximum ${MAX_DENOMINATIONS} denominations allowed`);
            return;
        }
        if (values.denominations.includes(trimmed)) {
            setError('Duplicate value not allowed');
            return;
        }

        setFieldValue('denominations', [...values.denominations, trimmed]);
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
            'denominations',
            values.denominations.filter(v => v !== value)
        );
    };

    return (
        <div>
            {sorted.length === 0 ? (
                <Flex
                    align="center"
                    justify="center"
                    className="w-full py-8 mb-5 rounded-xl border border-dashed border-gray-200 bg-gray-50"
                >
                    <Text type="secondary" className="text-sm">
                        No denominations added yet
                    </Text>
                </Flex>
            ) : (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {sorted.map(value => (
                        <Flex
                            key={value}
                            align="center"
                            justify="space-between"
                            className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm"
                        >
                            <Flex align="baseline" gap={4}>
                                <Text className="text-xs font-medium text-gray-400">₹</Text>
                                <Text className="text-base font-semibold text-gray-800">
                                    {formatNumberWithLocalString(Number(value))}
                                </Text>
                            </Flex>
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
                placeholder="Type an amount and press Enter to add"
                status={error ? 'error' : undefined}
                prefix={<Text className="text-gray-400 text-sm">₹</Text>}
                disabled={values.denominations.length >= MAX_DENOMINATIONS}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            {error && (
                <Text type="danger" className="block mt-1 text-xs">
                    {error}
                </Text>
            )}
            <Text type="secondary" className="block mt-2 text-xs">
                Type a number and press <kbd className="px-1 border rounded text-xs">Enter</kbd> to
                add.
            </Text>
        </div>
    );
};

export default DenominationInput;
