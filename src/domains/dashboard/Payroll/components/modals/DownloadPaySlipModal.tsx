import React, { useState } from 'react';

import { Button, Modal, Form, Flex, Checkbox, Select } from 'antd';
import { Formik, Field } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';

import DownloadPayslipData from '../../hooks/dashboardHooks/useDownloadPayslip';
import { useGetEmployee } from '../../hooks/docAndAssetsHooks/useGetEmployeeListApi';
import { downloadPayslipSchema } from '../../schema/dashboard/downloadPayslip';
import { monthsArray, yearsArray } from '../../utils/dashboard/data';
import useFilter from '../../utils/general/useFilter';

interface PayslipModalProps {
    open: boolean;
    handleCancel: () => void;
    setRefresh: (value: any) => void;
}

const DownloadPaySlipModal = ({ open, handleCancel, setRefresh }: PayslipModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { getPayslipDetails, isLoading } = DownloadPayslipData();

    const initialMonth = new Date().getMonth() + 1;
    const initialYear = new Date().getFullYear();
    const initialValues = {
        employeeId: '',
        month: initialMonth.toString(),
        year: initialYear,
        sendEmail: false,
    };
    const [filter, setFilter] = useState<any>(initialValues);
    const { handleChangeMonth, handleChangeYear } = useFilter({
        setFilter,
    });
    const handleFormSubmit = async (values: any) => {
        await getPayslipDetails(values.employeeId, filter.year, filter.month, values.sendEmail);
        handleCancel();
        setRefresh((prev: any) => !prev);
    };

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={handleFormSubmit}
            enableReinitialize
            validationSchema={downloadPayslipSchema}
        >
            {({ handleSubmit, values, setFieldValue }) => (
                <Modal
                    title="Download Payslip"
                    open={open}
                    onCancel={handleCancel}
                    footer={[
                        <Button
                            key="submit"
                            type="primary"
                            danger
                            onClick={() => handleSubmit()}
                            loading={isLoading}
                        >
                            Download
                        </Button>,
                        <Button key="cancel" onClick={handleCancel}>
                            Cancel
                        </Button>,
                    ]}
                >
                    <Form layout="vertical">
                        <SelectInputWithSearch
                            name="employeeId"
                            options={generateEmployeesDropdown(data) || []}
                            placeholder="Select employee"
                            label="Employee Name"
                            isRequired
                            handleChange={value => setFieldValue('employeeId', value ?? '')}
                        />

                        <Flex gap={20} className="my-4 w-full ">
                            <Select
                                options={monthsArray}
                                className="w-full"
                                onChange={handleChangeMonth}
                                defaultValue={initialMonth.toString()}
                            />
                            <Select
                                options={yearsArray}
                                className="w-full"
                                onChange={handleChangeYear}
                                defaultValue={initialYear}
                            />
                        </Flex>

                        <Form.Item>
                            <Field name="sendEmail">
                                {({ field }: any) => (
                                    <Checkbox {...field} checked={field.value}>
                                        Send Payslip(s) via email
                                    </Checkbox>
                                )}
                            </Field>
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default DownloadPaySlipModal;
