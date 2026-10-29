import { Typography } from 'antd';
import { useField } from 'formik';

import FieldError from '../FieldError';

const { Text } = Typography;

// Virtual-office option REMOVED (vendor decision 16-07): registration is only
// available to businesses that already have a registered office. The single
// option stays as an explicit confirmation the user must select.
const OPTIONS = [{ value: 'have', label: 'Yes, I have a registered office' }];

// "Registered Office Availability" (Figma 1842:25013) — shown for company-type entities.
const RegisteredOfficeAvailability = () => {
    const [field, , helpers] = useField('registeredOffice');
    const value = field.value as string;

    return (
        <div className="flex flex-col gap-3">
            <Text className="!text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                Registered Office Availability <span className="text-[#ff4f4f]">*</span>
            </Text>
            <div className="flex flex-col sm:flex-row gap-4">
                {OPTIONS.map(option => {
                    const selected = value === option.value;
                    return (
                        <button
                            type="button"
                            key={option.value}
                            // Single mandatory confirmation — allow toggling it
                            // off so the user can undo an accidental selection
                            // (it's still required to proceed).
                            onClick={() => helpers.setValue(selected ? '' : option.value)}
                            className={`flex-1 flex items-center gap-3 border rounded-[12px] px-4 py-4 text-left transition-colors ${
                                selected ? 'border-[#ff4f4f] bg-[#fff7f8]' : 'border-[#e4e4e7]'
                            }`}
                        >
                            <span
                                className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 ${
                                    selected ? 'border-[#ff4f4f]' : 'border-[#cbd5e1]'
                                }`}
                            >
                                {selected && <span className="w-[10px] h-[10px] rounded-full bg-[#ff4f4f]" />}
                            </span>
                            <span className="text-[14px] text-[#1e293b]">{option.label}</span>
                        </button>
                    );
                })}
            </div>
            <FieldError name="registeredOffice" />
        </div>
    );
};

export default RegisteredOfficeAvailability;
