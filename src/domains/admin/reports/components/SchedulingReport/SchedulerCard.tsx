import React, { useState } from 'react';

import { Button, Flex, Switch, Typography } from 'antd';

import ListTagsAndEmailInput from './ListTagsAndEmailInput';
import TimeComponent from './TimeComponent';
import UseShedulerData from '../../hooks/UseSchedulerData';
import { AllShedulerTypes } from '../../types/index';

const SchedulerCard = ({
    email,
    isActive,
    scheduledTime,
    title,
    scheduledDay,
    handleUpdateBtn,
    accessPermission,
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
    } = UseShedulerData({ email, handleUpdateBtn, isActive, scheduledTime, title, scheduledDay, accessPermission });
    return (
        <Flex
            vertical
            className="border border-solid border-gray-200 rounded-2xl p-8 h-full xs:bg-bgLightGray md:bg-white"
            justify="space-between"
            gap={20}
        >
            <Flex vertical gap={20}>
                <Flex justify="space-between">
                    <Typography.Title level={4}>{title}</Typography.Title>
                    {(accessPermission.update) && (
                    <Switch
                        size="small"
                        defaultChecked
                        onChange={handleSwitchChange}
                        checked={active}
                    />
                )}
                </Flex>
                <Flex vertical gap={10}>
                    <TimeComponent
                        WeekVal={WeekVal}
                        handleTimeChange={handleTimeChange}
                        timeVal={timeVal}
                        handleWeekChange={handleWeekChange}
                        week={title === 'Weekly Scheduler'}
                        disabled={!(accessPermission.update)}
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
                        disabled={!(accessPermission.update)}
                    />
                </Flex>
            </Flex>
            <Flex justify="end">
            {(accessPermission.update) && (
                <Button
                    danger
                    type="primary"
                    className="w-full sm:w-1/3"
                    onClick={() => {
                        validateAndAddEmail(setError);
                    }}
                    disabled={!isActive}
                >
                    Update
                </Button>
            )}
            </Flex>
        </Flex>
    );
};
export default SchedulerCard;
