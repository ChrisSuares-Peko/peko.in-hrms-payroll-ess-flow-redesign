import { forwardRef, useImperativeHandle, useRef } from 'react';

import { Form, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { updateEmployeeSchema } from '@src/domains/dashboard/Payroll/schema/salaryRollout/updateEmployeeSchema';
import { transactionTypeOptions } from '@src/domains/dashboard/Payroll/utils/salaryEmployeesColumns/data';

import {
    UpdateEmployeeFormHandle,
    UpdateEmployeeFormProps,
} from './UpdateEmployeeForm.types';

const { Text } = Typography;

const UpdateEmployeeForm = forwardRef<UpdateEmployeeFormHandle, UpdateEmployeeFormProps>(
    ({ employee, onSave, isLocked }, ref) => {
        const formikRef = useRef<FormikProps<any>>(null);

        useImperativeHandle(ref, () => ({
            submit: () => formikRef.current?.submitForm(),
        }));

        return (
            <Formik
                innerRef={formikRef}
                validationSchema={updateEmployeeSchema}
                initialValues={{
                    employeeName: employee.name,
                    accountName: employee.accountName ?? '',
                    accountNumber: employee.accountNumber,
                    bankName: employee.bankName,
                    transactionType: employee.transactionType ?? '',
                    upiId: employee.upiId ?? '',
                    ifscCode: employee.ifscCode ?? '',
                    remark: employee.remark ?? '',
                }}
                onSubmit={values =>
                    onSave({
                        accountName: values.accountName,
                        accountNumber: values.accountNumber,
                        bankName: values.bankName,
                        transactionType: values.transactionType,
                        upiId: values.upiId,
                        ifscCode: values.ifscCode,
                        remark: values.remark,
                    })
                }
            >
                {({ values }) => (
                    <Form layout="vertical" style={{ width: '100%' }}>
                        <TextInput
                            name="employeeName"
                            label="Employee Name"
                            placeholder="Employee name"
                            type="text"
                            readOnly
                            isDisabled
                            allowAlphabetsAndSpaceOnly
                            maxLength={50}
                        />

                        {isLocked && (
                            <Text style={{ display: 'block', fontSize: 13, color: '#F59E0B', marginBottom: 16 }}>
                                Bank details are locked as the account is verified and beneficiary is added.
                            </Text>
                        )}

                        <TextInput
                            name="accountName"
                            label="Account Holder Name"
                            placeholder="Enter account holder name"
                            type="text"
                            allowAlphabetsAndSpaceOnly
                            maxLength={50}
                            isRequired
                            isDisabled={isLocked}
                        />

                        <TextInput
                            name="accountNumber"
                            label="Bank Account Number"
                            placeholder="Enter account number"
                            type="text"
                            allowNumbersOnly
                            maxLength={18}
                            isRequired
                            isDisabled={isLocked}
                        />

                        <TextInput
                            name="bankName"
                            label="Bank Name"
                            placeholder="Enter bank name"
                            type="text"
                            allowAlphabetsAndSpaceOnly
                            maxLength={50}
                            isRequired
                            isDisabled={isLocked}
                        />

                        <SelectInput
                            name="transactionType"
                            label="Transaction Type"
                            placeholder="Select transaction type"
                            options={transactionTypeOptions}
                            isRequired
                            isDisabled={isLocked}
                        />

                        <TextInput
                            name="ifscCode"
                            label="IFSC Code"
                            placeholder="Enter IFSC code"
                            type="text"
                            allowAlphabetsAndNumbersOnly
                            maxLength={11}
                            convertToUppercase
                            isRequired
                            isDisabled={isLocked}
                        />

                        <TextInput
                            name="remark"
                            label="Remarks"
                            placeholder="Enter remark"
                            type="text"
                            allowAlphabetsAndSpaceOnly
                            maxLength={50}
                        />

                    </Form>
                )}
            </Formik>
        );
    }
);

export default UpdateEmployeeForm;
