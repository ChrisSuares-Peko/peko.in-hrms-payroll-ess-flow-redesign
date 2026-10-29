import { Button, Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import MonthPickerInput from '@components/atomic/inputs/MonthPickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { postOneTimePayment } from '@src/domains/dashboard/Payroll/api/paymentAccount';
import { useGetEligibleEmployees } from '@src/domains/dashboard/Payroll/hooks/dashboardHooks/useGetEligibleEmployees';
import { useGetPaymentVirtualAccountBalance } from '@src/domains/dashboard/Payroll/hooks/useGetPaymentVirtualAccountBalance';
import { oneTimePaymentSchema } from '@src/domains/dashboard/Payroll/schema/dashboard/oneTimePaymentSchema';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

const ONE_TIME_PAYMENT_INITIAL_VALUES = {
    month: '',
    employee: '',
    amount: '',
    remark: '',
    payFrom: '',
};

const OneTimePaymentForm = () => {
    const dispatch = useDispatch();
    const { corporateId } = useAppSelector(state => state.reducer.auth);

    const { employeeOptions } = useGetEligibleEmployees();

    const { virtualAccountNumber, accountName, balance } = useGetPaymentVirtualAccountBalance();
    const payFromOptions = virtualAccountNumber
        ? [{
            value: virtualAccountNumber,
            label: `${accountName ?? 'Virtual Account'} • ${virtualAccountNumber}${balance !== null ? ` (₹${balance.toLocaleString('en-IN')})` : ''}`,
          }]
        : [];

    return (
        <Flex
            vertical
            gap={30}
            style={{
                width: '100%',
                height: '100%',
                border: '1px solid #CBD5E1',
                borderRadius: 34,
                padding: 32,
            }}
        >
            <Flex vertical gap={12}>
                <Text style={{ fontSize: 18, fontWeight: 600, color: '#000000' }}>
                    One-Time Payments
                </Text>
                <Text style={{ fontSize: 13, lineHeight: '20px', color: '#6A7282' }}>
                    Need to pay a bonus, incentive, or ad-hoc salary? Process it here without touching the regular payroll cycle.
                </Text>
            </Flex>

            <Formik
                initialValues={ONE_TIME_PAYMENT_INITIAL_VALUES}
                validationSchema={oneTimePaymentSchema}
                onSubmit={async (values, { resetForm, setSubmitting }) => {
                    const result = await postOneTimePayment(corporateId, {
                        month: values.month,
                        employeeId: values.employee,
                        amount: parseFloat(values.amount),
                        remark: values.remark || undefined,
                        virtualAccountNumber: values.payFrom,
                    });
                    setSubmitting(false);
                    if (result && result.status) {
                        dispatch(showToast({ description: 'Payment processed successfully', variant: 'success' }));
                        resetForm();
                    } else if (result && !result.status) {
                        dispatch(showToast({ description: result.message ?? 'Failed to process payment. Please try again.', variant: 'error' }));
                    }
                }}
            >
                {({ handleSubmit, isSubmitting, setFieldTouched, setFieldValue }) => (
                    <Form layout="vertical" style={{ width: '100%' }} onFinish={handleSubmit}>
                        <MonthPickerInput
                            name="month"
                            label="Month"
                            placeholder="Select Month"
                            isRequired
                            classes="w-full"
                            minDate={dayjs().subtract(1, 'year').startOf('year')}
                            maxDate={dayjs().add(1, 'year').endOf('year')}
                        />
                        <SelectInput
                            name="employee"
                            label="Employee"
                            placeholder="Select employee"
                            options={employeeOptions}
                            isRequired
                            allowClear
                            showToolTip
                            tooltipText="Employees will be shown in the dropdown after their bank details are verified and added as beneficiary only"
                            handleChange={value => {
                                if (!value) {
                                    setFieldValue('employee', '');
                                    setFieldTouched('employee', true);
                                }
                            }}
                        />
                        <TextInput
                            name="amount"
                            label="Amount (₹)"
                            type="text"
                            placeholder="Enter amount"
                            allowTwoDecimalsOnly
                            maxLength={10}
                            isRequired
                        />
                        <TextInput
                            name="remark"
                            label="Remark"
                            type="text"
                            placeholder="e.g. Bonus payment"
                            maxLength={200}
                        />
                        <SelectInput
                            name="payFrom"
                            label="Pay From"
                            placeholder="Select bank account"
                            options={payFromOptions}
                            isRequired
                        />
                        <Button
                            type="primary"
                            danger
                            block
                            htmlType="submit"
                            loading={isSubmitting}
                        >
                            Proceed payment
                        </Button>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default OneTimePaymentForm;
