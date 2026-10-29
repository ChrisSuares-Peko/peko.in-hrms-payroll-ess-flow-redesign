import React, { useState, useEffect } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Form, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import PayrollCycleForm from './payrollCycle/PayrollCycleForm';
import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { payrollCycleSchema } from '../../schema/organizationSettings';
import { formatDayWithSuffix, formatDayWithSuffixForPayDay } from '../../utils/general/formatter';

interface Props {
    setActiveTabKey: (key: any) => void;
}
const PayrollCycleDetails: React.FC<Props> = ({ setActiveTabKey }) => {
    const { updatePayrollSettings } = useOrganizationSettingsApi();
    const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    const [isEditing, setIsEditing] = useState(false);
    const { payrollSettings, isLoading } = useAppSelector(state => state.reducer.orgSettings);

    useEffect(() => {
        if (isEditing && payrollSettings?.selectWorkingDays) {
            setSelectedDays(payrollSettings.selectWorkingDays);
        }
    }, [isEditing, payrollSettings]);

    if (!isEditing && payrollSettings?.calculateSalaryBasedOn) {
        return (
            <Flex vertical gap={20} className="pt-6">
                <Flex>
                    <Alert
                        message="Note: Pay Schedule cannot be edited once you process the first pay run."
                        type="warning"
                        showIcon
                    />
                </Flex>

                <Flex
                    vertical
                    style={{
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                    }}
                    className="w-2/5 p-3"
                >
                    <Flex justify="space-between" align="center" className="mt-3 ">
                        <Typography.Text className="font-medium" style={{ fontSize: '1.2rem' }}>
                            Payroll Schedule
                        </Typography.Text>
                        <Button className="border-0" onClick={() => setIsEditing(true)}>
                            <EditOutlined className="text-[#E30000]" />
                        </Button>
                    </Flex>
                    <Flex justify="space-between" className="mb-2">
                        <Typography.Text>Monthly Salary Based On</Typography.Text>
                        <Typography.Text>
                            {payrollSettings?.calculateSalaryBasedOn === 'ACTUALDAYS'
                                ? 'Actual Days in a Month'
                                : `Company Working Days`}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="space-between" className="mb-2">
                        <Typography.Text>Working Days</Typography.Text>
                        <Typography.Text>
                            {payrollSettings?.selectWorkingDays?.join(', ') || 'N/A'}
                        </Typography.Text>
                    </Flex>

                    <Flex justify="space-between" className="mb-2">
                        <Typography.Text>Pay Day</Typography.Text>
                        <Typography.Text>
                            {payrollSettings?.payEmployeeOn
                                ? `${formatDayWithSuffixForPayDay(parseInt(payrollSettings?.payEmployeeOn, 10))} of every month`
                                : 'N/A'}
                        </Typography.Text>
                    </Flex>
                    <Flex justify="space-between" className="mb-2">
                        <Typography.Text>First payroll from</Typography.Text>
                        <Typography.Text>
                            {payrollSettings?.payrollFrom
                                ? formatDayWithSuffix(payrollSettings?.payrollFrom)
                                : 'N/A'}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        );
    }

    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex>
            <Flex vertical gap={20} className="pt-6">
                <Formik
                    initialValues={{
                        selectWorkingDays: selectedDays,
                        calculateSalaryBasedOn:
                            payrollSettings?.calculateSalaryBasedOn || 'ACTUALDAYS',
                        payrollFrom: payrollSettings?.payrollFrom,
                        payEmployeeOn:Number(payrollSettings?.payEmployeeOn) || undefined,
                    }}
                    enableReinitialize
                    validationSchema={payrollCycleSchema}
                    validateOnChange
                    validateOnBlur
                    onSubmit={async (values, { setErrors }) => {
                        await updatePayrollSettings(values);
                        setIsEditing(false);
                    }}
                >
                    {({ handleSubmit, isSubmitting, setFieldValue, setFieldTouched, values, errors, touched }) => (
                        <Form layout="vertical" onFinish={handleSubmit}>
                            <PayrollCycleForm
                                setFieldValue={setFieldValue}
                                setFieldTouched={setFieldTouched}
                                values={values}
                                errors={errors}
                                touched={touched}
                            />

                            <Flex gap={10} className="mt-4">
                                <Button
                                    className="px-12"
                                    type="primary"
                                    danger
                                    htmlType="submit"
                                    loading={isSubmitting}
                                >
                                    Save
                                </Button>
                                {payrollSettings?.calculateSalaryBasedOn && (
                                    <Button
                                        className="px-12"
                                        type="default"
                                        htmlType="button"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </Flex>
                        </Form>
                    )}
                </Formik>
            </Flex>
        </Flex>
    );
};

export default PayrollCycleDetails;
