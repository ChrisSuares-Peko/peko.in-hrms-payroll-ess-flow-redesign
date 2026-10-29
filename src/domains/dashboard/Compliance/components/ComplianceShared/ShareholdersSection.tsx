import React from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

export interface ShareholderRow {
    shareholderName: string;
    pan: string;
    sharesHeld: string;
    subscribedAmount: string;
    paidAmount: string;
}

export const emptyShareholder = (): ShareholderRow => ({
    shareholderName: '',
    pan: '',
    sharesHeld: '',
    subscribedAmount: '',
    paidAmount: '',
});

interface Props {
    fieldName: string;
}

const ShareholdersSection: React.FC<Props> = ({ fieldName }) => {
    const { values } = useFormikContext<Record<string, ShareholderRow[]>>();
    const rows: ShareholderRow[] = values[fieldName] ?? [];

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex justify="space-between" align="center" className="mb-5">
                <Flex vertical gap={2}>
                    <Text className="!text-[14px] !font-semibold !text-black">Shareholders / Subscribers</Text>
                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Add all shareholders and their subscription details</Text>
                </Flex>
            </Flex>

            <FieldArray name={fieldName}>
                {({ push, remove }) => (
                    <Flex vertical gap={16}>
                        {rows.map((_, i) => (
                            <div key={i} className="border border-[#f0f0f0] rounded-[14px] p-4">
                                <Flex justify="space-between" align="center" className="mb-3">
                                    <Text className="!text-[13px] !font-medium !text-[#314259]">Shareholder {i + 1}</Text>
                                    {rows.length > 1 && (
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
                                        <TextInput name={`${fieldName}[${i}].shareholderName`} label="Shareholder Name" type="text" placeholder="Enter name" isRequired />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].pan`} label="PAN" type="text" placeholder="e.g. ABCDE1234F" convertToUppercase maxLength={10} />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].sharesHeld`} label="No. of Shares Held" type="text" placeholder="Enter number" allowNumbersOnly />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].subscribedAmount`} label="Subscribed Amount (₹)" type="text" placeholder="Enter amount" allowNumbersOnly />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].paidAmount`} label="Paid Amount (₹)" type="text" placeholder="Enter amount" allowNumbersOnly />
                                    </Col>
                                </Row>
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => push(emptyShareholder())}
                            className="!border-[#ff4f4f] !text-[#ff4f4f] !rounded-[10px]"
                        >
                            Add Shareholder
                        </Button>
                    </Flex>
                )}
            </FieldArray>
        </div>
    );
};

export default ShareholdersSection;
