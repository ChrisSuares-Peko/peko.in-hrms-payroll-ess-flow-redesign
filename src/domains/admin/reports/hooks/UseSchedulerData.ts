import { useState } from 'react';

import { TimePickerProps } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { AllShedulerTypes } from '../types/index';

const UseShedulerData = ({
    handleUpdateBtn,
    title,
    isActive,
    email,
    scheduledTime,
    scheduledDay,
}: AllShedulerTypes) => {
    const dispatch = useAppDispatch();
    const [inputValue, setInputValue] = useState('');
    const [values, setValues] = useState<string[] | undefined | false>(email);
    const [timeVal, setTimeVal] = useState<string | false | undefined>(scheduledTime);
    const [WeekVal, setweekVal] = useState<string | false | undefined>(scheduledDay);
    const [active, setActive] = useState<boolean | undefined | undefined>(isActive);
    const [isValidEmail, setValidEmail] = useState<boolean | null>(null);
    const handleSwitchChange = (checked: boolean) => {
        if (timeVal) {
            handleUpdateBtn(title, values, timeVal, WeekVal, checked);
            setActive(!active);
        } else
            dispatch(
                showToast({
                    description: 'Please select a time',
                    variant: 'warning',
                })
            );
    };
    const handleInputChange = (e: any) => {
        setInputValue(e.target.value);
        setValidEmail(null);
    };
    const handleWeekChange = (selectedOption: string) => {
        setweekVal(selectedOption);
    };
    const validateAddEmail = () => {
        if (!inputValue || (values && values.includes(inputValue))) {
            setValidEmail(false);
            setTimeout(() => {
                setValidEmail(null);
            }, 2500);
            return;
        }
        if (values) {
            setValues([...values, inputValue]);
        } else {
            setValues([inputValue]);
        }
        setInputValue('');
        setValidEmail(true);
        setTimeout(() => {
            setValidEmail(null);
        }, 2500);
    };

    const validateEmail = (emailId: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailId);
    };
    const validateAndAddEmail = (setError: (val: string) => void) => {
        if (!inputValue) {
            handleUpdateBtn(title, values, timeVal, WeekVal, isActive);
            setError('');
            return;
        }
        if (!validateEmail(inputValue)) {
            // If email is invalid
            setError('Invalid email format.');
            setValidEmail(false);
            setTimeout(() => setValidEmail(null), 2500);
            return;
        }
        if (values && values.includes(inputValue)) {
            setError('Email already exists.');
            setValidEmail(false);
            setTimeout(() => {
                setValidEmail(null);
            }, 2500);
            return;
        }
        const newValues = values ? [...values, inputValue] : [inputValue];
        setValues(newValues);
        handleUpdateBtn(title, newValues, timeVal, WeekVal, isActive);
        setInputValue('');
        setError('');
        setValidEmail(true);
        setTimeout(() => setValidEmail(null), 2500);
    };
    const handleTagClose = (removedValue: string) => {
        if (!timeVal) {
            dispatch(
                showToast({
                    description: 'Please select a time',
                    variant: 'warning',
                })
            );
        }
        if (values) {
            const filteredValues = values.filter(value => value !== removedValue);
            setValues(filteredValues);
            handleUpdateBtn(title, filteredValues, timeVal, WeekVal, isActive);
        }
    };

    const handleTimeChange: TimePickerProps['onChange'] = (time, timeStrings: any) => {
        setTimeVal(timeStrings);
    };

    return {
        validateAddEmail,
        validateAndAddEmail,
        handleInputChange,
        handleSwitchChange,
        isValidEmail,
        handleTagClose,
        handleTimeChange,
        active,
        timeVal,
        inputValue,
        values,
        WeekVal,
        handleWeekChange,
    };
};

export default UseShedulerData;
