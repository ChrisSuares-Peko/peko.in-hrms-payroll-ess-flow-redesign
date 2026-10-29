import React from 'react';

import { Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { TDSFormValues } from './tdsTypes';

const { Text } = Typography;

const TYPE_OPTIONS = [
    {
        value: 'TAN_REG',
        label: 'TAN Registration',
        desc: 'Mandatory for entities deducting/collecting tax. TDS via Challan ITNS-281 by 7th of following month.',
    },
    {
        value: 'TDS_RETURN',
        label: 'TDS Return Filing',
        desc: 'Quarterly. Q1→31 Jul | Q2→31 Oct | Q3→31 Jan | Q4→31 May. Late: ₹200/day (Sec 234E)',
    },
];

const TDSTypeSelection: React.FC = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<TDSFormValues>();
    const selected = values.tds_selectedTypes;

    const toggle = (value: string) => {
        if (selected.includes(value)) {
            setFieldValue(
                'tds_selectedTypes',
                selected.filter((v) => v !== value),
            );
        } else {
            setFieldValue('tds_selectedTypes', [...selected, value]);
        }
    };

    const hasError = touched.tds_selectedTypes && errors.tds_selectedTypes;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Select TDS Services Required</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Select one or more services — sections below will update accordingly
                </Text>
            </Flex>

            <Flex gap={16} wrap="wrap">
                {TYPE_OPTIONS.map((opt) => {
                    const isActive = selected.includes(opt.value);
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggle(opt.value)}
                            className={[
                                'flex-1 min-w-[240px] border rounded-[16px] p-5 cursor-pointer transition-all select-none text-left',
                                isActive
                                    ? 'border-[#ff4f4f] bg-[#fff8f8]'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#ff4f4f]',
                            ].join(' ')}
                        >
                            <Flex align="flex-start" gap={12}>
                                {/* Custom checkbox */}
                                <div
                                    className={[
                                        'mt-0.5 w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-colors',
                                        isActive
                                            ? 'border-[#ff4f4f] bg-[#ff4f4f]'
                                            : 'border-[#cbd0dc] bg-white',
                                    ].join(' ')}
                                >
                                    {isActive && (
                                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                            <path
                                                d="M1 4L4 7L10 1"
                                                stroke="white"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <Flex vertical gap={4}>
                                    <Text className="!text-[14px] !font-semibold !text-[#1a1a1a]">{opt.label}</Text>
                                    <Text className="!text-[12px] !text-[rgba(0,0,0,0.45)] leading-relaxed">
                                        {opt.desc}
                                    </Text>
                                </Flex>
                            </Flex>
                        </button>
                    );
                })}
            </Flex>

            {hasError && (
                <Text className="!text-[#ff4f4f] !text-[12px] mt-2 block">
                    {errors.tds_selectedTypes as string}
                </Text>
            )}
        </div>
    );
};

export default TDSTypeSelection;
