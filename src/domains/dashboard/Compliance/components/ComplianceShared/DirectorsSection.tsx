import React from 'react';

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

const { Text } = Typography;

export interface DirectorRow {
    directorName: string;
    din: string;
    pan: string;
    designation: string;
    mobile: string;
    email: string;
    dscAvailable: string;
}

export const emptyDirector = (): DirectorRow => ({
    directorName: '',
    din: '',
    pan: '',
    designation: '',
    mobile: '',
    email: '',
    dscAvailable: '',
});

interface Props {
    fieldName: string;
}

const DirectorsSection: React.FC<Props> = ({ fieldName }) => {
    const { values } = useFormikContext<Record<string, DirectorRow[]>>();
    const rows: DirectorRow[] = values[fieldName] ?? [];

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex justify="space-between" align="center" className="mb-5">
                <Flex vertical gap={2}>
                    <Text className="!text-[14px] !font-semibold !text-black">Directors</Text>
                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Add all directors of the company</Text>
                </Flex>
            </Flex>

            <FieldArray name={fieldName}>
                {({ push, remove }) => (
                    <Flex vertical gap={16}>
                        {rows.map((_, i) => (
                            <div key={i} className="border border-[#f0f0f0] rounded-[14px] p-4">
                                <Flex justify="space-between" align="center" className="mb-3">
                                    <Text className="!text-[13px] !font-medium !text-[#314259]">Director {i + 1}</Text>
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
                                        <TextInput name={`${fieldName}[${i}].directorName`} label="Director Name" type="text" placeholder="Enter director name" isRequired />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].din`} label="DIN" type="text" placeholder="8-digit DIN" maxLength={8} allowNumbersOnly />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].pan`} label="PAN" type="text" placeholder="e.g. ABCDE1234F" convertToUppercase maxLength={10} />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].designation`} label="Designation" type="text" placeholder="e.g. Director" />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].mobile`} label="Mobile Number" type="text" placeholder="10-digit mobile" allowNumbersOnly maxLength={10} addonBefore="+91" />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <TextInput name={`${fieldName}[${i}].email`} label="Email" type="email" placeholder="Enter email" />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <SelectInput
                                            name={`${fieldName}[${i}].dscAvailable`}
                                            label="DSC Available?"
                                            placeholder="Select"
                                            options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                        />
                                    </Col>
                                </Row>
                            </div>
                        ))}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => push(emptyDirector())}
                            className="!border-[#ff4f4f] !text-[#ff4f4f] !rounded-[10px]"
                        >
                            Add Director
                        </Button>
                    </Flex>
                )}
            </FieldArray>
        </div>
    );
};

export default DirectorsSection;
