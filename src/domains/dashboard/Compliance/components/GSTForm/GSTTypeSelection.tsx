import React from 'react';

import { Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { GSTFormValues } from './gstTypes';

const { Text } = Typography;

const GST_TYPES = [
    {
        value: 'GST_REG',
        label: 'New GST Registration',
        desc: 'Mandatory above threshold turnover or for inter-state supply, e-commerce, RCM. DSC mandatory for companies.',
    },
    {
        value: 'GST_RETURN',
        label: 'GST Return Filing',
        desc: 'GSTR-1, GSTR-3B, GSTR-9, CMP-08 etc. QRMP support for quarterly filing.',
    },
];

const GSTTypeSelection: React.FC = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<GSTFormValues>();
    const selected = values.gst_selectedTypes;

    const toggle = (value: string) => {
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        setFieldValue('gst_selectedTypes', next);
    };

    const hasError = touched.gst_selectedTypes && errors.gst_selectedTypes;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Service Type</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Select one or both services you require
                </Text>
            </Flex>

            <Flex gap={16} wrap="wrap">
                {GST_TYPES.map((type) => {
                    const isSelected = selected.includes(type.value);
                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => toggle(type.value)}
                            className={[
                                'flex-1 min-w-[240px] border rounded-[14px] p-4 cursor-pointer transition-all select-none text-left',
                                isSelected
                                    ? 'border-[#ff4f4f] bg-[#fff5f5]'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#ff4f4f] hover:bg-[#fff9f9]',
                            ].join(' ')}
                        >
                            <Flex align="flex-start" gap={12}>
                                <div
                                    className={[
                                        'mt-[2px] shrink-0 w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-colors',
                                        isSelected
                                            ? 'border-[#ff4f4f] bg-[#ff4f4f]'
                                            : 'border-[#d1d5db] bg-white',
                                    ].join(' ')}
                                >
                                    {isSelected && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path
                                                d="M1 4L3.5 6.5L9 1"
                                                stroke="white"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <Flex vertical gap={4}>
                                    <Text
                                        className={[
                                            '!text-[14px] !font-semibold',
                                            isSelected ? '!text-[#ff4f4f]' : '!text-[#1a1a1a]',
                                        ].join(' ')}
                                    >
                                        {type.label}
                                    </Text>
                                    <Text className="!text-[12px] !text-[#6b7280] leading-relaxed">
                                        {type.desc}
                                    </Text>
                                </Flex>
                            </Flex>
                        </button>
                    );
                })}
            </Flex>

            {hasError && (
                <Text className="!text-[12px] !text-[#ff4f4f] !mt-2 block">
                    {errors.gst_selectedTypes as string}
                </Text>
            )}
        </div>
    );
};

export default GSTTypeSelection;
