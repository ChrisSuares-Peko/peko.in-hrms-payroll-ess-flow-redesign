import { useState } from 'react';

import { TimePickerProps } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { removeEmoji } from '@utils/regex';

import { AllShedulerTypes } from '../types';

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
            const isToggle = true;
            handleUpdateBtn(title, values, timeVal, WeekVal, checked, isToggle);
            setActive(!active);
        } else
            dispatch(
                showToast({
                    description: 'Please select a scheduled time',
                    variant: 'warning',
                })
            );
    };
    const handleInputChange = (e: any) => {
        let filteredValue = e.target.value;
        filteredValue = filteredValue.replace(removeEmoji, '');
        setInputValue(filteredValue);
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
    const validateAndAddEmail = (setError: (val: string) => void) => {
        if (!inputValue) {
            handleUpdateBtn(title, values, timeVal, WeekVal, isActive);
            setError('');
            return;
        }
        if (!inputValue || (values && values.includes(inputValue))) {
            setValidEmail(false);
            setTimeout(() => {
                setValidEmail(null);
            }, 2500);
            return;
        }
        if (values) {
            setValues([...values, inputValue]);
            handleUpdateBtn(title, [...values, inputValue], timeVal, WeekVal, isActive);
            setError('');
        } else {
            setValues([inputValue]);
            handleUpdateBtn(title, [inputValue], timeVal, WeekVal, isActive);
            setError('');
        }

        setInputValue('');
        setValidEmail(true);
        setTimeout(() => {
            setValidEmail(null);
        }, 2500);
    };
    const handleTagClose = (removedValue: string) => {
        if (!timeVal) {
            dispatch(
                showToast({
                    description: 'Please select a scheduled time',
                    variant: 'warning',
                })
            );
        } else if (values && email && email.includes(removedValue)) {
            setValues(values.filter((value: string) => value !== removedValue));
            handleUpdateBtn(
                title,
                values.filter((value: string) => value !== removedValue),
                timeVal,
                WeekVal,
                isActive
            );
        } else {
            setValues(values && values.filter((value: string) => value !== removedValue));
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
