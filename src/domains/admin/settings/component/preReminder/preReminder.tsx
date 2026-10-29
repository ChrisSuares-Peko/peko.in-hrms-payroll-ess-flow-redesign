import React, { useEffect, useState } from 'react';

import { Button, Typography, Tag, Form as AntForm, Skeleton, TimePicker, Flex } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { useFindRolesService } from '@utils/findRolesService';

import useAddReminders from '../../hooks/preReminders/useAddReminders';
import useFetchReminders from '../../hooks/preReminders/useFetchReminders';
import useRemoveReminders from '../../hooks/preReminders/useRemoveReminders';
import { days, RolePermissionAccessData } from '../../types/preReminders';

const { Title, Text } = Typography;

const ReminderForm: React.FC = () => {
    const [schedulers, setSchedulers] = useState<Array<days>>([]);
    const [timeVal, setTimeVal] = useState<string>('');
    const dispatch = useDispatch();
    const { addReminder, isLoading: addLoading } = useAddReminders();
    const { getReminders, reminders, isLoading: fetchLoading } = useFetchReminders();
    const { deleteReminder, isLoading: removeLoading } = useRemoveReminders();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Subscription Reminders'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    // Fetch existing reminders when the component is mounted
    useEffect(() => {
        getReminders();
    }, [getReminders]);

    // Update schedulers state when reminders are fetched
    useEffect(() => {
        if (reminders) {
            setSchedulers(reminders.days || []);
        }
    }, [reminders]);

    const validationSchema = Yup.object({
        days: Yup.number()
            .required('Please enter the number of days.')
            .positive('Days must be a positive number.')
            .max(30, 'Days must be less than 30.')
            .test('unique-day', 'This day is already set.', value =>
                value ? !schedulers.some(scheduler => scheduler.day === value) : true
            ),
        reminderType: Yup.string().required('Please select a reminder type.'),
        scheduledTime: Yup.string().required('Please pick a time.'),
    }).test('max-reminders', 'You can only set up to 4 reminders.', () => schedulers.length < 4);

    const handleTagClose = async (scheduler: { day: number; scheduledTime: string }) => {
        const success = await deleteReminder({
            day: scheduler.day,
            scheduledTime: scheduler.scheduledTime,
        });
        if (success) {
            setSchedulers(prevDays => prevDays.filter(d => d.day !== scheduler.day));
            dispatch(
                showToast({ description: 'Reminder removed successfully!', variant: 'success' })
            );
            setTimeVal('');
        } else {
            dispatch(showToast({ description: 'Failed to remove reminder.', variant: 'error' }));
        }
    };

    const handleTimeChange = (
        time: dayjs.Dayjs | null,
        timeString: string | string[],
        setFieldValue: (field: string, value: any) => void
    ) => {
        if (typeof timeString === 'string') {
            setTimeVal(timeString);
            setFieldValue('scheduledTime', timeString);
        }
    };

    return (
        <div className="border border-solid border-gray-200 rounded-2xl p-8 h-full lg:w-1/2 w-full md:bg-white">
            <Skeleton loading={fetchLoading || removeLoading} active>
                <Title level={2} className="text-lg">
                    Set Automatic Reminders
                </Title>
                <Text className="text-gray-600">
                    Reminder notifications are scheduled to be sent within 24 hours from the date
                    specified, only after all other criteria are met.
                </Text>

                <Formik
                    initialValues={{ days: '', reminderType: 'Subscription', scheduledTime: '' }}
                    validationSchema={validationSchema}
                    onSubmit={async (values, { resetForm }) => {
                 

                        const day = Number(values.days);

                        if (schedulers.length >= 4) {
                            dispatch(
                                showToast({
                                    description: 'You can only set up to 4 reminders.',
                                    variant: 'warning',
                                })
                            );
                            return;
                        }

                        if (!schedulers.some(scheduler => scheduler.day === day)) {
                            const reminderName =
                                values.reminderType === 'Subscription'
                                    ? 'preRemaindersForSubscription'
                                    : 'otherReminderType';

                            const reminderData = {
                                day,
                                scheduledTime: values.scheduledTime,
                                name: reminderName,
                            };

                            const data = await addReminder(reminderData);

                            if (data) {
                                setSchedulers(prevDays => [
                                    ...prevDays,
                                    { day, scheduledTime: values.scheduledTime },
                                ]);
                                dispatch(
                                    showToast({
                                        description: 'Reminder added successfully!',
                                        variant: 'success',
                                    })
                                );
                            } else {
                                dispatch(
                                    showToast({
                                        description: 'Failed to add reminder.',
                                        variant: 'error',
                                    })
                                );
                            }

                            resetForm();
                        }
                    }}
                >
                    {({ handleSubmit, setFieldValue, errors, touched }) => (
                        <AntForm onFinish={handleSubmit} layout="vertical" className="mt-6 w-full">
                            <AntForm.Item
                                label="Select Reminder"
                                validateStatus={
                                    touched.reminderType && errors.reminderType ? 'error' : ''
                                }
                                help={touched.reminderType && errors.reminderType}
                            >
                                <SelectInput
                                    isDisabled={!!(accessPermission && !accessPermission.update)}
                                    name="reminderType"
                                    placeholder="Select Reminder Type"
                                    options={[{ value: 'Subscription', label: 'Subscription' }]}
                                    handleChange={(value: string) =>
                                        setFieldValue('reminderType', value)
                                    }
                                />
                            </AntForm.Item>

                            <Flex vertical gap={5}>
                                <Flex vertical>
                                    <Typography.Text className="text-normal">
                                        Pick Time
                                    </Typography.Text>
                                    <AntForm.Item
                                        validateStatus={
                                            touched.scheduledTime && errors.scheduledTime
                                                ? 'error'
                                                : ''
                                        }
                                        help={touched.scheduledTime && errors.scheduledTime}
                                    >
                                        <TimePicker
                                            disabled={
                                                !!(accessPermission && !accessPermission.update)
                                            }
                                            value={timeVal ? dayjs(timeVal, 'HH:mm') : undefined}
                                            className="w-full"
                                            format="HH:mm"
                                            onChange={(time, timeString) =>
                                                handleTimeChange(time as any, timeString, setFieldValue)
                                            }
                                        />
                                    </AntForm.Item>
                                </Flex>

                                {schedulers.length === 0 ? (
                                    ''
                                ) : (
                                    <Flex vertical>
                                        <Title level={4}>Scheduled Reminders</Title>
                                        <Flex wrap="wrap" className="my-4">
                                            {schedulers.map(scheduler => (
                                                <Flex
                                                    vertical
                                                    gap={2}
                                                    key={`${scheduler.day}-${scheduler.scheduledTime}`}
                                                >
                                                    <Tag
                                                        closable={
                                                            !(
                                                                accessPermission &&
                                                                !accessPermission.update
                                                            )
                                                        }
                                                        onClose={() => handleTagClose(scheduler)}
                                                        className="h-7 flex items-center"
                                                        color="green"
                                                    >
                                                        {`Day ${scheduler.day} at ${scheduler.scheduledTime}`}
                                                    </Tag>
                                                </Flex>
                                            ))}
                                        </Flex>
                                    </Flex>
                                )}

                                <AntForm.Item label="No of days to be sent before the service due date">
                                    <TextInput
                                        isDisabled={
                                            !!(accessPermission && !accessPermission.update)
                                        }
                                        name="days"
                                        handleChange={value => setFieldValue('days', value)}
                                        placeholder="Enter number of days"
                                        type="text"
                                        allowNumbersOnly
                                        classes="w-full"
                                    />
                                </AntForm.Item>
                            </Flex>

                            <Flex gap={3} justify="center" className="sm:justify-start">
                                {accessPermission && accessPermission.update && (
                                    <Button
                                        key="submit"
                                        type="primary"
                                        danger
                                        className="h-10 px-6"
                                        size="large"
                                        htmlType="submit"
                                        loading={addLoading}
                                    >
                                        Schedule Reminder
                                    </Button>
                                )}
                            </Flex>
                        </AntForm>
                    )}
                </Formik>
            </Skeleton>
        </div>
    );
};

export default ReminderForm;
