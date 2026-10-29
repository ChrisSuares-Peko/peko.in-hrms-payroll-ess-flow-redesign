import React from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import TextInput from '@src/components/atomic/inputs/TextInput';

import { EmployeeRow, EPFESIFormValues } from './epfEsiTypes';

const { Text } = Typography;

const ESI_EXEMPT_THRESHOLD = 21000;

const EmployeeDetailsSection: React.FC = () => {
    const { values } = useFormikContext<EPFESIFormValues>();
    const employees: EmployeeRow[] = values.epf_employees ?? [];

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Employee Details</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Enter wage and contribution details for each employee
                </Text>
            </Flex>

            <FieldArray name="epf_employees">
                {({ push, remove }) => (
                    <Flex vertical gap={16}>
                        {employees.map((emp, i) => {
                            const grossWagesNum = parseFloat(emp.grossWages);
                            const showEsiExempt =
                                !Number.isNaN(grossWagesNum) && grossWagesNum > ESI_EXEMPT_THRESHOLD;

                            return (
                                <div
                                    key={i}
                                    className="border border-[#f0f0f0] rounded-[14px] p-4"
                                >
                                    <Flex
                                        justify="space-between"
                                        align="center"
                                        className="mb-3"
                                    >
                                        <Text className="!text-[13px] !font-medium !text-[#314259]">
                                            Employee {i + 1}
                                        </Text>
                                        {employees.length > 1 && (
                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(i)}
                                                className="!text-[#ff4f4f] !p-0"
                                                size="small"
                                            />
                                        )}
                                    </Flex>

                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`epf_employees[${i}].employeeName`}
                                                label="Employee Name"
                                                type="text"
                                                placeholder="Enter full name"
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`epf_employees[${i}].uanOrIpNumber`}
                                                label="UAN / IP Number"
                                                type="text"
                                                placeholder="Enter UAN or IP number"
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`epf_employees[${i}].grossWages`}
                                                label="Gross Wages (₹)"
                                                type="text"
                                                placeholder="Enter gross wages"
                                                allowNumbersOnly
                                            />
                                            {showEsiExempt && (
                                                <div className="mt-1">
                                                    <Text className="!text-[11px] !text-[#faad14]">
                                                        ESI exempt — wages above ₹21,000
                                                    </Text>
                                                </div>
                                            )}
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`epf_employees[${i}].epfWages`}
                                                label="EPF Wages (₹)"
                                                type="text"
                                                placeholder="Enter EPF wages"
                                                allowNumbersOnly
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`epf_employees[${i}].esiWages`}
                                                label="ESI Wages (₹)"
                                                type="text"
                                                placeholder="Enter ESI wages"
                                                allowNumbersOnly
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            );
                        })}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() =>
                                push({
                                    employeeName: '',
                                    uanOrIpNumber: '',
                                    grossWages: '',
                                    epfWages: '',
                                    esiWages: '',
                                })
                            }
                            className="!border-[#ff4f4f] !text-[#ff4f4f] !rounded-[10px]"
                        >
                            Add Employee
                        </Button>
                    </Flex>
                )}
            </FieldArray>
        </div>
    );
};

export default EmployeeDetailsSection;
