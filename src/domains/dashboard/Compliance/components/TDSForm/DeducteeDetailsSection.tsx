import React from 'react';

import { DeleteOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import SelectInputWithSearch from '@src/components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@src/components/atomic/inputs/TextInput';

import { DeducteeRow, TDSFormValues } from './tdsTypes';

const { Text } = Typography;

const SECTION_OPTIONS = [
    { label: '192 – Salary', value: '192' },
    { label: '194A – Interest', value: '194A' },
    { label: '194C – Contractor', value: '194C' },
    { label: '194H – Commission', value: '194H' },
    { label: '194I – Rent', value: '194I' },
    { label: '194J – Professional Fees', value: '194J' },
    { label: '194T – Partner Payments', value: '194T' },
    { label: 'Other', value: 'Other' },
];

const emptyDeductee = (): DeducteeRow => ({
    deducteeName: '',
    pan: '',
    section: '',
    amountPaid: '',
    tdsDeducted: '',
});

const DeducteeDetailsSection: React.FC = () => {
    const { values } = useFormikContext<TDSFormValues>();
    const deductees = values.tds_deductees;

    const totalTdsDeducted = deductees.reduce((sum, d) => {
        const val = parseFloat(d.tdsDeducted || '0');
        return sum + (Number.isNaN(val) ? 0 : val);
    }, 0);

    const retTotalTds = parseFloat(values.ret_totalTds || '0');
    const hasMismatch = !Number.isNaN(retTotalTds) && retTotalTds > 0 && Math.abs(totalTdsDeducted - retTotalTds) > 0.01;

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={4} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">Deductee Details</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                    Enter details for each deductee from whom TDS was deducted
                </Text>
            </Flex>

            <FieldArray name="tds_deductees">
                {({ push, remove }) => (
                    <Flex vertical gap={16}>
                        {deductees.map((row, i) => {
                            const tdsVal = parseFloat(row.tdsDeducted || '0');
                            const amtVal = parseFloat(row.amountPaid || '0');
                            const tdsExceedsAmount =
                                !Number.isNaN(tdsVal) && !Number.isNaN(amtVal) && amtVal > 0 && tdsVal > amtVal;

                            return (
                                <div key={i} className="border border-[#f0f0f0] rounded-[14px] p-4">
                                    <Flex justify="space-between" align="center" className="mb-3">
                                        <Text className="!text-[13px] !font-medium !text-[#314259]">
                                            Deductee {i + 1}
                                        </Text>
                                        {deductees.length > 1 && (
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
                                                name={`tds_deductees[${i}].deducteeName`}
                                                label="Deductee Name"
                                                type="text"
                                                placeholder="Enter name"
                                                isRequired
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`tds_deductees[${i}].pan`}
                                                label="PAN"
                                                type="text"
                                                placeholder="e.g. ABCDE1234F"
                                                convertToUppercase
                                                maxLength={10}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <SelectInputWithSearch
                                                name={`tds_deductees[${i}].section`}
                                                label="TDS Section"
                                                placeholder="Select section"
                                                options={SECTION_OPTIONS}
                                                classes="w-full"
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`tds_deductees[${i}].amountPaid`}
                                                label="Amount Paid/Credited (₹)"
                                                type="text"
                                                placeholder="Enter amount"
                                                allowNumbersOnly
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput
                                                name={`tds_deductees[${i}].tdsDeducted`}
                                                label="TDS Deducted (₹)"
                                                type="text"
                                                placeholder="Enter TDS amount"
                                                allowNumbersOnly
                                            />
                                            {tdsExceedsAmount && (
                                                <Flex align="center" gap={4} className="-mt-3 mb-2">
                                                    <WarningOutlined className="text-[#faad14] text-[11px]" />
                                                    <Text className="!text-[11px] !text-[#faad14]">
                                                        TDS deducted exceeds amount paid
                                                    </Text>
                                                </Flex>
                                            )}
                                        </Col>
                                    </Row>
                                </div>
                            );
                        })}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => push(emptyDeductee())}
                            className="!border-[#ff4f4f] !text-[#ff4f4f] !rounded-[10px]"
                        >
                            Add Deductee
                        </Button>
                    </Flex>
                )}
            </FieldArray>

            {/* Running total */}
            <div className="border-t border-[#f0f0f0] mt-5 pt-4">
                <Flex justify="space-between" align="center">
                    <Text className="!text-[13px] !text-[#314259]">
                        Total TDS Deducted (from deductee rows):
                    </Text>
                    <Text className="!text-[14px] !font-semibold !text-[#314259]">
                        ₹{totalTdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                </Flex>
                {retTotalTds > 0 && (
                    <Flex justify="space-between" align="center" className="mt-1">
                        <Text className="!text-[13px] !text-[#314259]">Expected Total TDS (from summary):</Text>
                        <Text className="!text-[14px] !font-semibold !text-[#314259]">
                            ₹{retTotalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                    </Flex>
                )}
                {hasMismatch && (
                    <Flex align="center" gap={6} className="mt-2 bg-[#fffbe6] rounded-[8px] p-3 border border-[#ffe58f]">
                        <WarningOutlined className="text-[#faad14]" />
                        <Text className="!text-[12px] !text-[#d48806]">
                            The sum of deductee TDS (₹{totalTdsDeducted.toFixed(2)}) does not match the total TDS
                            entered in the summary (₹{retTotalTds.toFixed(2)}). Please verify.
                        </Text>
                    </Flex>
                )}
            </div>
        </div>
    );
};

export default DeducteeDetailsSection;
