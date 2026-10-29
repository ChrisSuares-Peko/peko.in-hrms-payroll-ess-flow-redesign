import React, { useEffect, useRef, useState } from 'react';

import { Alert, AutoComplete, Form } from 'antd';
import { Field, FieldProps, FormikProps } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { USD_TO_INR } from '@src/config-global';

import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import useSubscriptionCreate from '../../hooks/subscriptionHooks/useCreateSubscriptionApi';
import { useGetSoftwaresList } from '../../hooks/subscriptionHooks/useGetSoftwaresListApi';
import { useUpdateSubscription } from '../../hooks/subscriptionHooks/useUpdateSubscriptionApi';
import { subscriptionDocSchema } from '../../schema';
import { amountRecurrings, currencies, subscriptionStatus } from '../../utils/enumValues';

interface SubscriptionModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
}

const SubscriptionModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    reloadInfo,
}: SubscriptionModalProps) => {
    const subscriptionForm = useRef<FormikProps<any>>(null);
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const getEmployeesList = () => {
        const employees = generateEmployeesDropdown(data) || [];
        const assignedList = subscriptionForm.current?.values?.assignTo;
        if (assignedList && assignedList.length > 0) {
            return employees.filter(
                employee => !assignedList.find((assign: any) => assign === employee.label)
            );
        }
        return employees;
    };

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [employeeOptions, setEmployeeOptions] = useState(getEmployeesList() || []);
    useEffect(() => {
        setEmployeeOptions(getEmployeesList() || []);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    const { handleCreateSubscription, submitLoading: creationLoading } =
        useSubscriptionCreate(handleCancel);
    const { handleUpdateSubscription, submitLoading: updationLoading } =
        useUpdateSubscription(handleCancel);
    const { softwaresData, generateSoftwaresDropdown } = useGetSoftwaresList();

    const handleFormSubmit = async (values: any) => {
        const selectedEmployees = values.assignTo.map((id: number | string) => {
            const employessList = generateEmployeesDropdown(data);
            if (typeof id === 'number') {
                const employee = employessList.find(emp => emp.value === id);
                return { employeeName: employee?.label ?? '', id };
            }
            const employee = employessList.find(emp => emp.label === id);
            return { employeeName: employee?.label ?? '', id: employee?.value };
        });

        const payload = {
            ...values,
            assignTo: selectedEmployees,
        };

        if (selectedRecordData) {
            await handleUpdateSubscription(payload, selectedRecordData?.id);
        } else {
            await handleCreateSubscription(payload).then(res => {
                if (res) {
                    handleCancel();
                }
            });
        }
        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
    };

    const excludedStatuses = ['Inactive', 'Pending', 'Cancelled', 'Suspended', 'Failed'];

    const amount = Number(selectedRecordData?.amount ?? 0) || 0;
    const exchangeRate = parseFloat(USD_TO_INR) || 1;

    const initialConvertedAmount =
        selectedRecordData?.id && selectedRecordData?.currency === 'USD'
            ? (amount * exchangeRate).toFixed(2)
            : (amount / exchangeRate).toFixed(2);

    const [convertedAmount, setConvertedAmount] = useState<string>(initialConvertedAmount);

    const handleAmountChange = (value: string) => {
        // Use a regular expression to allow only numbers and decimal points
        const isValid = /^[0-9]*\.?[0-9]*$/.test(value);

        if (isValid) {
            let converted: string;

            // Convert USD_TO_INR to a number
            const conversionRate = parseFloat(USD_TO_INR);

            if (subscriptionForm.current?.values.currency === 'INR') {
                // Convert INR to USD
                converted = (+value / conversionRate).toFixed(2);
            } else if (subscriptionForm.current?.values.currency === 'USD') {
                // Convert USD to INR
                converted = (+value * conversionRate).toFixed(2);
            } else if (!subscriptionForm.current?.values.currency) {
                // by default it assume as INR
                // Convert INR to USD
                converted = (+value / conversionRate).toFixed(2);
            } else {
                converted = '0.00'; // Default to 0 if currency is not recognized
            }

            setConvertedAmount(converted);
        }
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Subscription' : 'Add Subscription'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={{
                cloudSoftwareId: selectedRecordData?.cloudSoftwareId,
                subscriptionName: selectedRecordData?.subscriptionName ?? '',
                planDetails: selectedRecordData?.planDetails ?? '',
                billingStartDate: selectedRecordData?.billingStartDate ?? '',
                billingCycle: selectedRecordData?.billingCycle ?? '',
                assignTo: Array.isArray(selectedRecordData?.assignTo)
                    ? selectedRecordData?.assignTo.map((emp: any) => `${emp.employeeName}`)
                    : [],
                // eslint-disable-next-line no-nested-ternary
                numberOfUsers: selectedRecordData?.numberOfDevices
                    ? `${selectedRecordData?.numberOfDevices}`
                    : selectedRecordData
                      ? '0'
                      : '',
                // eslint-disable-next-line no-nested-ternary
                amount: selectedRecordData?.amount
                    ? `${parseFloat(selectedRecordData.amount).toFixed(2)}`
                    : selectedRecordData
                      ? '0'
                      : '',
                status: selectedRecordData?.status ?? '',
                currency: selectedRecordData?.currency ?? '',
            }}
            formRefName={subscriptionForm}
            validationSchema={subscriptionDocSchema}
            reinitialise
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    {/* <SelectInputWithSearch
                        name="subscriptionName"
                        options={generateSoftwaresDropdown(softwaresData) || []}
                        placeholder="Select subscription software"
                        label="Software"
                        handleChange={value => {
                            // eslint-disable-next-line eqeqeq
                            const software = softwaresData.find(book => book.id == value);
                            subscriptionForm.current?.setFieldValue(
                                'subscriptionName',
                                software?.name
                            );
                        }}
                    />
                    <TextInput
                        name="subscriptionName"
                        type="text"
                        placeholder="Enter subscription name"
                        label="Subscription Name"
                        isRequired
                        isDisabled={subscriptionForm.current?.values?.cloudSoftwareId}
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    /> */}
                    <Field name="subscriptionName">
                        {({ field, form: { touched, errors } }: FieldProps) => (
                            <Form.Item
                                label={<span title="">Subscription Name</span>}
                                colon={false}
                                required
                                validateStatus={
                                    touched[field.name] && errors[field.name] ? 'error' : ''
                                }
                                help={
                                    touched[field.name] && errors[field.name]
                                        ? (errors[field.name] as React.ReactNode)
                                        : undefined
                                }
                            >
                                <AutoComplete
                                    options={generateSoftwaresDropdown(softwaresData) || []}
                                    style={{ width: '100%' }}
                                    placeholder="Select Software"
                                    onSelect={value => {
                                        // Find the software using the selected value (ID)
                                        const software = softwaresData.find(
                                            book => book.id === value
                                        );
                                        if (software) {
                                            // Set the form field to the software name
                                            setFieldValue('subscriptionName', software.name || '');
                                        }
                                    }}
                                    onChange={value => {
                                        // Update the form field with the current input value
                                        setFieldValue('subscriptionName', value);
                                    }}
                                    value={field.value}
                                />
                            </Form.Item>
                        )}
                    </Field>
                    <TextInput
                        name="planDetails"
                        type="text"
                        placeholder="Enter plan details"
                        label="Plan Details"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <SelectInput
                        name="billingCycle"
                        placeholder="Select billing cycle"
                        label="Billing Cycle"
                        isRequired
                        options={amountRecurrings}
                    />
                    <DatePickerInput
                        name="billingStartDate"
                        label="Billing Start Date"
                        placeholder="Select billing start date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                    />
                    <SelectInputWithSearch
                        name="assignTo"
                        options={employeeOptions}
                        placeholder="Select employees"
                        label="Employee name"
                        mode="multiple"
                        isDisabled={values?.status && excludedStatuses.includes(values?.status)}
                        handleChange={() => {
                            if (timeoutId) {
                                clearTimeout(timeoutId);
                            }
                            const id = setTimeout(() => {
                                setEmployeeOptions(getEmployeesList() || []);
                            }, 1000);
                            setTimeoutId(id);
                        }}
                    />
                    <TextInput
                        name="numberOfUsers"
                        type="text"
                        label="Number of Users"
                        placeholder="Enter number of users"
                        allowNumbersOnly
                        maxLength={6}
                    />
                    <SelectInput
                        name="status"
                        placeholder="Select status"
                        label="Status"
                        isRequired
                        options={
                            values?.assignTo?.length
                                ? subscriptionStatus.filter(
                                      status => !excludedStatuses.includes(status.value)
                                  )
                                : subscriptionStatus
                        }
                    />
                    <SelectInput
                        name="currency"
                        placeholder="Select currency"
                        label="Currency"
                        isRequired
                        options={currencies}
                        handleChange={val => {
                            setFieldValue('amount', '');
                        }}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        label="Charges (per license)"
                        placeholder="Enter amount"
                        isRequired
                        allowTwoDecimalsOnly
                        maxLength={6}
                        // autoComplete="off"
                        handleChange={handleAmountChange}
                    />
                    {Number(subscriptionForm.current?.values.amount ?? 0) ? (
                        <Alert
                            message={
                                <>
                                    {subscriptionForm?.current?.values?.amount &&
                                        (subscriptionForm.current?.values.currency === 'USD'
                                            ? `(${Number(subscriptionForm.current.values.amount).toFixed(2)} USD is approximately ${convertedAmount} INR)`
                                            : `(${Number(subscriptionForm.current.values.amount).toFixed(2)} INR is approximately ${convertedAmount} USD)`)}
                                </>
                            }
                        />
                    ) : (
                        <Alert message={<>1 USD = {USD_TO_INR} INR</>} />
                    )}
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default SubscriptionModal;
