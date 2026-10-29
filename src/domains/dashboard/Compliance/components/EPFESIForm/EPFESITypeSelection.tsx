import React from 'react';

import { Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { EPFESIFormValues } from './epfEsiTypes';

const { Text } = Typography;

interface TypeCard {
    value: string;
    label: string;
    desc: string;
    rates: string;
}

const TYPE_CARDS: TypeCard[] = [
    {
        value: 'EPF_ESI_REG',
        label: 'EPF / ESI Registration or Activation',
        desc: 'EPF: 20+ employees mandatory | ESI: 10+ employees mandatory',
        rates: 'EPF: 12%+12% | ESI: 3.25%+0.75%',
    },
    {
        value: 'EPF_ESI_RETURN',
        label: 'EPF / ESI Return Filing',
        desc: 'Monthly ECR, Annual Return, ESI Monthly/Half-Yearly',
        rates: 'Monthly dues by 15th of following month',
    },
];

const EPFESITypeSelection: React.FC = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<EPFESIFormValues>();
    const selected = values.epf_selectedTypes ?? [];

    const toggle = (value: string) => {
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value];
        setFieldValue('epf_selectedTypes', next);
    };

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Service Type</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Select one or more services — form sections will appear below
                </Text>
            </Flex>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TYPE_CARDS.map((card) => {
                    const isSelected = selected.includes(card.value);
                    return (
                        <button
                            key={card.value}
                            type="button"
                            onClick={() => toggle(card.value)}
                            className={[
                                'text-left border rounded-[16px] p-5 transition-all cursor-pointer w-full',
                                isSelected
                                    ? 'border-[#ff4f4f] bg-[#fff8f8]'
                                    : 'border-[#e0e0e0] bg-white hover:border-[#ff4f4f]',
                            ].join(' ')}
                        >
                            <Flex align="flex-start" gap={12}>
                                {/* Checkbox indicator */}
                                <div
                                    className={[
                                        'mt-[2px] w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors',
                                        isSelected
                                            ? 'bg-[#ff4f4f] border-[#ff4f4f]'
                                            : 'border-[#d9d9d9] bg-white',
                                    ].join(' ')}
                                >
                                    {isSelected && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path
                                                d="M1 4L3.5 6.5L9 1"
                                                stroke="white"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </div>

                                <Flex vertical gap={4} className="flex-1">
                                    <Text
                                        className={[
                                            '!text-[13px] !font-semibold',
                                            isSelected ? '!text-[#ff4f4f]' : '!text-[#314259]',
                                        ].join(' ')}
                                    >
                                        {card.label}
                                    </Text>
                                    <Text className="!text-[12px] !text-[rgba(0,0,0,0.55)]">
                                        {card.desc}
                                    </Text>
                                    <div className="mt-1 inline-flex">
                                        <span className="text-[11px] font-medium text-[#ff4f4f] bg-[#fff1f1] rounded-[6px] px-2 py-[2px]">
                                            {card.rates}
                                        </span>
                                    </div>
                                </Flex>
                            </Flex>
                        </button>
                    );
                })}
            </div>

            {touched.epf_selectedTypes && errors.epf_selectedTypes && (
                <Text className="!text-[12px] !text-[#ff4f4f] mt-2 block">
                    {errors.epf_selectedTypes as string}
                </Text>
            )}
        </div>
    );
};

export default EPFESITypeSelection;
