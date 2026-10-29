import { useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import { Field, FieldProps } from 'formik';
import { useDispatch } from 'react-redux';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { showToast } from '@src/slices/apiSlice';

import { useAddHoliday } from '../../hooks/dashboardHooks/useAddHolidayApi';
import { useDeleteHolidayApi } from '../../hooks/dashboardHooks/useDeleteHolidayApi';
import { useUpdateHoliday } from '../../hooks/dashboardHooks/useUpdateHolidayApi';
import { holidaySchema } from '../../schema/holidaySchema';

type AddHolidaysModalProps = {
    open: boolean;
    handleCancel: () => void;
    setRefresh: (value: any) => void;
    holiDayData?: any;
    setHolidayData: (value: any) => void;
    holidayType: string;
};

const AddHolidaysModal = ({
    open,
    handleCancel,
    setRefresh,
    holiDayData,
    setHolidayData,
    holidayType,
}: AddHolidaysModalProps) => {
    const dispatch = useDispatch();

    const { addHoliday, isLoading: addLoading } = useAddHoliday();
    const { updateHoliday, isLoading: updateLoading } = useUpdateHoliday();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const submitHoliday = async (values: any) => {
        let res: boolean;
        if (holiDayData) {
            const holidayId = holiDayData.id;

            res = await updateHoliday({
                ...values,
                start: new Date(values.start).setHours(23, 59, 59, 999),
                end: values.end,
                holidayId,
            });
            if (res) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Holiday Updated successfully',
                        variant: 'success',
                    })
                );
            }

            handleCancel();
            setHolidayData(null);
        } else {
            res = await addHoliday({
                ...values,
            });
            if (res) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Holiday added successfully',
                        variant: 'success',
                    })
                );

                handleCancel();
            }
        }
    };
    const { deleteHolidayData, isLoading } = useDeleteHolidayApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleDeleteHoliday = async () => {
        handleCancel();
        const res = await deleteHolidayData(holiDayData.id);
        if (res) {
            setRefresh(true);
            dispatch(
                showToast({
                    description: 'Holiday deleted successfully',
                    variant: 'success',
                })
            );
        }
    };
    return (
        <CustomModalWithForm
            isLoading={holidayType !== 'ADD' ? addLoading : updateLoading}
            modalTitle={
                <Flex justify="space-between">
                    <Typography.Text className="font-medium">
                        {holidayType !== 'ADD' ? 'Edit ' : 'Add '}
                        Holiday
                    </Typography.Text>
                    {holidayType !== 'ADD' && (
                        <DeleteOutlined
                            className="text-xl text-bgOrange2"
                            onClick={() => setOpenConfirmationModal(true)}
                        />
                    )}
                </Flex>
            }
            open={open}
            validationSchema={holidaySchema}
            validateOnChange
            handleCancel={handleCancel}
            handleFormSubmit={submitHoliday}
            reinitialise
            initialValues={{
                title: holiDayData ? holiDayData?.title : '',
                isAllDay: true,
                start:
                    holiDayData && holiDayData.start && holiDayData.start.d
                        ? dayjs(holiDayData.start.d)
                        : '',
                end:
                    holiDayData && holiDayData.end && holiDayData.end.d
                        ? dayjs(holiDayData.end.d)
                        : '',
                category: 'allday',
                sendPriorEmailDate: holiDayData?.sendPriorEmailDate,
            }}
        >
            <Flex vertical className=" w-full">
                <Flex className=" text-gray-500 text-[.8rem] mb-4">
                    Add an official holiday for all employees.
                </Flex>
                <Form layout="vertical">
                    <TextInput
                        name="title"
                        type="text"
                        label="Holiday Name"
                        placeholder="Enter holiday name"
                        isRequired
                        classes=" rounded-sm w-full"
                        maxLength={50}
                        allowAlphabetsAndSpaceOnly
                    />

                    <DatePickerInput
                        name="start"
                        label="Holiday Start Date"
                        placeholder="Select Start Date"
                        isRequired
                        classes=" rounded-sm w-full"
                        needConfirm={false}
                    />
                    <Field name="start">
                        {({ field, form: { values } }: FieldProps) => (
                            <DatePickerInput
                                name="end"
                                label="Holiday End Date"
                                placeholder="Select End Date"
                                isRequired
                                classes=" rounded-sm w-full"
                                needConfirm={false}
                                minDate={dayjs(values.start)}
                            />
                        )}
                    </Field>
                    {holidayType !== 'ADD' ? (
                        ''
                    ) : (
                        <Field name="start">
                            {({ field, form: { values } }: FieldProps) => (
                                <DatePickerInput
                                    name="sendPriorEmailDate"
                                    label="Holiday Reminder Date"
                                    placeholder="Select Holiday Reminder Date"
                                    isRequired
                                    classes=" rounded-sm w-full"
                                    needConfirm={false}
                                    minDate={dayjs(values.start).subtract(1, 'week')}
                                    maxDate={values.start && dayjs(values.start).subtract(1, 'day')}
                                />
                            )}
                        </Field>
                    )}
                </Form>
            </Flex>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this holiday?"
                handleSubmit={handleDeleteHoliday}
                isLoading={isLoading}
            />
        </CustomModalWithForm>
    );
};

export default AddHolidaysModal;
