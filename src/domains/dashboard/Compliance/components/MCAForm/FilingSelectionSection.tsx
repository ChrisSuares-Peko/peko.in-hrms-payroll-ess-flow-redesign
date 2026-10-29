import React from 'react';

import { Checkbox, Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { MCAFormValues } from './mcaTypes';

const { Text } = Typography;

const FILING_OPTIONS = [
    { value: 'ADT1', label: 'ADT-1', desc: 'Within 30 days of incorporation' },
    { value: 'AOC4', label: 'AOC-4', desc: 'Within 30 days of AGM' },
    { value: 'MGT7', label: 'MGT-7 / MGT-7A', desc: 'Within 60 days of AGM' },
    { value: 'DIR3KYC', label: 'DIR-3 KYC', desc: 'Due by 30 June annually' },
    { value: 'DPT3', label: 'DPT-3', desc: 'Due by 30 June annually' },
    { value: 'MSME1', label: 'MSME-1', desc: 'Half-yearly (Apr 30 & Oct 31)' },
    { value: 'OTHER', label: 'Other ROC Filing', desc: 'Event-based filings' },
];

const FilingSelectionSection: React.FC = () => {
    const { values, setFieldValue, errors, touched } = useFormikContext<MCAFormValues>();

    const handleChange = (checkedValues: string[]) => {
        setFieldValue('mca_selectedFilings', checkedValues);
    };

    const hasError =
        touched.mca_selectedFilings &&
        errors.mca_selectedFilings &&
        typeof errors.mca_selectedFilings === 'string';

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">ROC Filing Types</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Select all filings required — relevant sections will appear below
                </Text>
            </Flex>

            <Checkbox.Group
                value={values.mca_selectedFilings}
                onChange={(vals) => handleChange(vals as string[])}
                className="w-full"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
                    {FILING_OPTIONS.map((opt) => {
                        const isChecked = values.mca_selectedFilings.includes(opt.value);
                        return (
                            <div
                                key={opt.value}
                                className={[
                                    'flex items-start gap-3 border rounded-[14px] p-4 cursor-pointer transition-all',
                                    isChecked
                                        ? 'border-[#ff4f4f] bg-[#fff5f5]'
                                        : 'border-[#ebebeb] bg-white hover:border-[#ff4f4f]',
                                ].join(' ')}
                            >
                                <Checkbox value={opt.value} className="mt-0.5 shrink-0" />
                                <Flex vertical gap={2}>
                                    <Text className="!text-[13px] !font-semibold !text-[#314259]">
                                        {opt.label}
                                    </Text>
                                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                        {opt.desc}
                                    </Text>
                                </Flex>
                            </div>
                        );
                    })}
                </div>
            </Checkbox.Group>

            {hasError && (
                <Text className="!text-[12px] !text-[#ff4f4f] mt-2 block">
                    {errors.mca_selectedFilings as string}
                </Text>
            )}
        </div>
    );
};

export default FilingSelectionSection;
