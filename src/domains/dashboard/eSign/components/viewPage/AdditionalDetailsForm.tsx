import { useEffect, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { FormValues, SigningPolicy } from '../../types';

const ESIGN_TYPE_OPTIONS: { value: SigningPolicy; label: string }[] = [
    { value: 'QUICKSIGN', label: 'Normal eSign' },
    { value: 'AADHAAR', label: 'Aadhaar-based eSign' },
];

const AdditionalDetailsForm = ({ signersLength }: { signersLength: number }) => {
    const { values, setFieldValue } = useFormikContext<FormValues>();
    const currentTime = dayjs();
    const { isDisabled, reminder } = useAppSelector(state => state.reducer.eSignDoc);
    const [showReminder, setShowReminder] = useState(false);
    const handleReminder = (e: CheckboxChangeEvent) => {
        setShowReminder(e.target.checked);
    };
    useEffect(() => {
        if (reminder) {
            setShowReminder(true);
        } else {
            setShowReminder(false);
        }
    }, [reminder]);

    useEffect(() => {
        if (signersLength <= 1) {
            setFieldValue('sequentialSignature', false);
        }
    }, [signersLength, setFieldValue]);

    return (
        <Flex vertical className="mt-10" gap={16}>
            <Typography.Text className="text-lg font-medium">Additional Details:</Typography.Text>
            <Flex className=" w-full lg:w-5/12" vertical>
                <CheckboxInput
                    name="sequentialSignature"
                    disabled={isDisabled || signersLength <= 1}
                >
                    <Flex align="center" gap={7}>
                        Enable sequential signing
                        <Tooltip
                            title="Signers will receive email invitation only after previous signers have completed the eSign."
                            placement="bottomLeft"
                            color="white"
                            overlayInnerStyle={{ color: '#171717' }}
                            overlayStyle={{ minWidth: 300 }}
                        >
                            <InfoCircleOutlined className="text-[#A0A0A0]" />
                        </Tooltip>
                    </Flex>
                </CheckboxInput>

                <Flex vertical gap={12} className="mb-6">
                    <Typography.Text
                        style={{ fontFamily: 'Roboto', fontWeight: 600, fontSize: 15, lineHeight: '21px', color: '#314259' }}
                    >
                        Select eSign Type
                    </Typography.Text>
                    <Flex vertical gap={12}>
                        {ESIGN_TYPE_OPTIONS.map(option => {
                            const isSelected = (values.signingPolicy || 'QUICKSIGN') === option.value;
                            const selectSigningPolicy = () => {
                                if (isDisabled) return;
                                setFieldValue('signingPolicy', option.value);
                            };
                            return (
                                <Flex
                                    key={option.value}
                                    align="center"
                                    gap={12}
                                    className={isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                                    onClick={selectSigningPolicy}
                                >
                                    <span
                                        role="radio"
                                        aria-checked={isSelected}
                                        className="flex items-center justify-center rounded-full shrink-0"
                                        style={{ width: 16, height: 16, boxSizing: 'border-box', border: `2px solid ${isSelected ? '#FF4F4F' : '#314259'}` }}
                                    >
                                        {isSelected && (
                                            <span className="rounded-full" style={{ width: 8, height: 8, background: '#FF4F4F' }} />
                                        )}
                                    </span>
                                    <Typography.Text
                                        style={{ fontFamily: 'Roboto', fontWeight: 400, fontSize: 14, lineHeight: '21px', color: '#314259' }}
                                    >
                                        {option.label}
                                    </Typography.Text>
                                </Flex>
                            );
                        })}
                    </Flex>
                </Flex>

                <TextInput
                    classes="w-full "
                    label="Initiator Name"
                    name="initiator_name"
                    placeholder="Enter initiator name"
                    type="text"
                    isRequired
                    isDisabled={isDisabled}
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />

                <TextInput
                    classes="w-full "
                    label="Initiator Email"
                    name="initiator_email"
                    placeholder="Enter initiator email"
                    type="text"
                    isRequired
                    isDisabled={isDisabled}
                    maxLength={50}
                    allowEmailsOnly
                />
                <DatePickerInput
                    classes="w-full"
                    placeholder="Select last date to sign"
                    name="expiry_date"
                    label="Last Date to Sign"
                    tooltipText="Document will be available for eSign till 90 days."
                    showToolTip
                    minDate={currentTime.add(1, 'day')}
                    maxDate={currentTime.add(90, 'day')}
                    isDisabled={isDisabled}
                />
                {/* <SwitchInput
                    name='reminder'
                    label='Enable Automatic reminders'
                    isDisabled={isDisabled}
                /> */}
                <CheckboxInput name="reminder" disabled={isDisabled} onChange={handleReminder}>
                    {' '}
                    Enable automatic reminders
                </CheckboxInput>
                {showReminder && (
                    <TextInput
                        name="reminder_interval"
                        placeholder="Enter days"
                        label="Send a reminder every"
                        type="text"
                        allowNumbersOnly
                        suffix="days"
                        isDisabled={isDisabled}
                        maxLength={2}
                        isRequired
                    />
                )}
            </Flex>
        </Flex>
    );
};

export default AdditionalDetailsForm;
