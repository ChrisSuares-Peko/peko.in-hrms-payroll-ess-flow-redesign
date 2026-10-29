import { memo, useState } from 'react';

import { Button, Flex, Switch, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import ListTagsAndEmailInput from './ListTagsAndEmailInput';
import TimeComponent from './TimeComponent';
import UseShedulerData from '../hooks/UseShedulerData';
import { AllShedulerTypes } from '../types/index';

const { Title } = Typography;

const SchedulerCard = ({
    email,
    isActive,
    scheduledTime,
    title,
    scheduledDay,
    handleUpdateBtn,
}: AllShedulerTypes) => {
    const [error, setError] = useState('');
    const {
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
        handleWeekChange,
        WeekVal,
    } = UseShedulerData({ email, handleUpdateBtn, isActive, scheduledTime, title, scheduledDay });
    const dispatch = useDispatch()
    return (
        <Flex
            vertical
            className="border border-solid border-gray-200 rounded-2xl p-8 h-full xs:bg-bgLightGray md:bg-white"
            justify="space-between"
            gap={20}
        >
            <Flex vertical gap={20}>
                <Flex justify="space-between">
                    <Title style={{ fontWeight: 400 }} level={4}>
                        {title}
                    </Title>
                    <Switch
                        size="small"
                        defaultChecked
                        onChange={handleSwitchChange}
                        checked={active}
                    />
                </Flex>
                <Flex vertical gap={10}>
                    <TimeComponent
                        WeekVal={WeekVal}
                        handleTimeChange={handleTimeChange}
                        timeVal={timeVal}
                        handleWeekChange={handleWeekChange}
                        week={title === 'Weekly Scheduler'}
                    />
                </Flex>
                <Flex vertical gap={10}>
                    <ListTagsAndEmailInput
                        error={error}
                        setError={setError}
                        email={email}
                        handleInputChange={handleInputChange}
                        handleTagClose={handleTagClose}
                        validateAddEmail={validateAddEmail}
                        inputValue={inputValue}
                        values={values}
                        isValidEmail={isValidEmail}
                        disabled={!active}
                    />
                </Flex>
            </Flex>
            <Flex justify="end">
                <Button
                    danger
                    type="primary"
                    className="w-full sm:w-1/3"
                    onClick={() => {
                        const trimmedInput = inputValue.trim();
                        if (email?.length <= 0 && !trimmedInput)
                            dispatch(
                                showToast({ description: 'Emails are empty', variant: 'error' })
                            );
                        else if (trimmedInput.includes(',') || trimmedInput.split(' ').length > 1) {
                            dispatch(
                                showToast({
                                    description: 'Only one email ID can be added at a time',
                                    variant: 'error',
                                })
                            );
                        } else if (error === '') {
                            validateAndAddEmail(setError);
                        }

                    }}
                    disabled={!isActive}
                >
                    Update
                </Button>
            </Flex>
        </Flex>
    );
};
export default memo(SchedulerCard);
