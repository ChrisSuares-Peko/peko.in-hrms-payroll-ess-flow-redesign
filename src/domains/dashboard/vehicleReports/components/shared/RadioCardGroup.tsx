import { Flex, Radio, Typography } from 'antd';

import { SelectOption } from '../../types/index';

interface Props {
    label?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

// Bordered radio cards (red border + pink tint when selected). The shared
// atomic RadioGroupInput only supports flat string labels inside an antd
// Radio.Group, so the card chrome is hand-rolled here — same accessible
// pattern as CompanyIncorporation's BasicDetails step.
const RadioCardGroup = ({ label, options, value, onChange, error }: Props) => (
    <Flex vertical gap={8} className="flex-1">
        {!!label && (
            <Typography.Text className="text-sm text-[#475569]">{label}</Typography.Text>
        )}
        <Flex gap={12} className="flex-wrap">
            {options.map(option => {
                const isSelected = value === option.value;
                return (
                    <div
                        key={option.value}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => onChange(option.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onChange(option.value);
                            }
                        }}
                        className={`flex min-w-[150px] flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-[10px] shadow-[0px_2px_20px_rgba(0,0,0,0.04)] transition-all ${
                            isSelected
                                ? 'border-[#FF4F4F] bg-[#FFF6F6]'
                                : 'border-transparent bg-white'
                        }`}
                    >
                        <Radio checked={isSelected} className="!mr-0" />
                        <Typography.Text
                            className={`text-sm ${isSelected ? 'text-[#0A0A0A]' : 'text-[#475569]'}`}
                        >
                            {option.label}
                        </Typography.Text>
                    </div>
                );
            })}
        </Flex>
        {!!error && (
            <Typography.Text className="text-xs text-[#FF4F4F]">{error}</Typography.Text>
        )}
    </Flex>
);

export default RadioCardGroup;
