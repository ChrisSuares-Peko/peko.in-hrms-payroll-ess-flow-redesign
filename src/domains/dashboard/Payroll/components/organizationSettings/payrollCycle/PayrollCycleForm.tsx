import React from 'react';

import { Alert, Checkbox, Col, Flex, Radio, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';

import WorkDetailsWithTabs from '../WorkDetailsWithTab';

type Props = {
    setFieldValue: (field: string, value: any) => void;
    setFieldTouched?: (field: string, touched?: boolean, shouldValidate?: boolean) => void;
    values: any;
    errors: any;
    touched?: any;
};

const PayrollCycleForm: React.FC<Props> = ({ setFieldValue, setFieldTouched, values, errors, touched = {} }) => (
    <Row className="xs:p-4 md:p-8 border rounded-2xl border-[#EAEAEA]">
        <Col xs={24} xl={14}>
            <Typography.Text className="font-medium text-[1.25rem]">Payroll Cycles</Typography.Text>

            <Flex className="xs:mt-2 md:mt-4">
                <Alert
                    message="Note: Pay Schedule cannot be edited once you process the first pay run."
                    type="warning"
                    showIcon
                />
            </Flex>

            <Flex vertical className="mt-6">
                <Typography.Text className="font-medium text-sm">
                    Calculate Monthly Salary Based on:
                </Typography.Text>

                <Radio.Group
                    className="mt-4"
                    onChange={e => setFieldValue('calculateSalaryBasedOn', e.target.value)}
                    value={values.calculateSalaryBasedOn}
                >
                    <Flex vertical gap={10}>
                        <Radio value="ACTUALDAYS">Actual days in a month</Radio>
                        <Radio value="COMPANYWORKINGDAYS">Company working days</Radio>
                    </Flex>
                </Radio.Group>
            </Flex>

            <Flex vertical className="mt-4">
                <Typography.Text className="font-medium text-sm">
                    Select Working Days
                </Typography.Text>
                <Typography.Text className="mt-2 text-xs text-[#888]">
                    The days worked in a calendar week
                </Typography.Text>
                <Flex className="mt-4">
                    <Checkbox.Group
                        value={values.selectWorkingDays}
                        onChange={checked => setFieldValue('selectWorkingDays', checked)}
                    >
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => {
                            const isChecked = values.selectWorkingDays.includes(day);
                            return (
                                <div
                                    key={day}
                                    role="checkbox"
                                    tabIndex={0}
                                    aria-checked={isChecked}
                                    onClick={() => {
                                        const updatedDays = isChecked
                                            ? values.selectWorkingDays.filter(
                                                  (d: string) => d !== day
                                              )
                                            : [...values.selectWorkingDays, day];
                                        setFieldValue('selectWorkingDays', updatedDays);
                                        setFieldTouched?.('selectWorkingDays', true, false);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            const updatedDays = isChecked
                                                ? values.selectWorkingDays.filter(
                                                      (d: string) => d !== day
                                                  )
                                                : [...values.selectWorkingDays, day];
                                            setFieldValue('selectWorkingDays', updatedDays);
                                            setFieldTouched?.('selectWorkingDays', true, false);
                                        }
                                    }}
                                    style={{
                                        margin: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        backgroundColor: isChecked ? '#ff4d4f' : '',
                                        color: isChecked ? '#fff' : '#000',
                                        border: isChecked
                                            ? '1px solid #ff4d4f'
                                            : '1px solid #d9d9d9',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Checkbox value={day} style={{ display: 'none' }} />
                                    {day}
                                </div>
                            );
                        })}
                    </Checkbox.Group>
                </Flex>

                {touched.selectWorkingDays && errors.selectWorkingDays && (
                    <Typography.Text style={{ color: 'red', marginTop: '8px' }}>
                        {errors.selectWorkingDays}
                    </Typography.Text>
                )}
            </Flex>

            <Flex className="xs:mt-2 md:mt-5">
                <DatePickerInput
                    name="payrollFrom"
                    label={
                        <Typography.Text className="font-medium">
                            Start your first payroll from:
                        </Typography.Text>
                    }
                    placeholder="Select Date"
                    classes="rounded-sm xs:w-full md:w-[18.8rem]"
                    isRequired
                    minDate={dayjs().subtract(1, 'year')}
                    maxDate={dayjs().add(1,'year').endOf("month")}
                    needConfirm={false}
                />
            </Flex>

            {/* <DatePickerInput
                name="payEmployeeOn"
                label={
                    <Typography.Text className="font-medium">
                        Pay your employees on:
                    </Typography.Text>
                }
                placeholder="Select Date"
                classes="rounded-sm xs:w-full md:w-[18.8rem]"
                isRequired
                needConfirm={false}
            /> */}
            <Col md={11}>
            <SelectInput
                name="payEmployeeOn"
                placeholder="Select day of the month"
                options={Array.from({ length: 28 }, (_, i) => ({
                    id: i + 1,
                    value: i + 1,
                }))}
                classes="rounded-sm xs:w-full md:w-[0rem]"
                label="Pay Your Employees On"
                isRequired
                showSearch
                showToolTip
                tooltipText='Provide the date when you usually disburse the salaries to your employees.'
            />
            <Typography.Text className="block -mt-3 text-[10px] text-[#888]">
                Payroll dates are limited to the 28th to ensure consistency across all calendar months.
            </Typography.Text>
            </Col>
        </Col>

        <Col xs={24} xl={10}>
            <WorkDetailsWithTabs data={values} calculateSalaryBasedOn={values.calculateSalaryBasedOn}/>
        </Col>
    </Row>
);

export default PayrollCycleForm;
