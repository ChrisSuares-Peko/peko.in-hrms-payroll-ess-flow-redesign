import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FieldArray } from 'formik';
import { ReactSVG } from 'react-svg';

import add from '@domains/dashboard/Invoice/assets/add.svg';

import EditGuidelineForm from './EditGuidelineForm';

const { Text } = Typography;

type WishListProps = {
    values: any;
    data: any;
    isLoading: boolean;
};
const EditGuideline = ({ values, data, isLoading }: WishListProps) => (
    <Flex vertical>
        <Flex align="center" className="w-full mb-5">
            <Text className="text-xl font-medium">Invoice Reminders</Text>
        </Flex>
        <Content className="py-4 bg-gray-50 xs:hidden xl:block ">
            <Row>
                <Col span={8}>
                    <Text className="text-sm font-medium ">Days</Text>
                </Col>
                <Col span={10}>
                    <Text className="text-sm font-medium">Action</Text>
                </Col>
                <Col span={4}>
                    <Text className="text-sm font-medium ">Template</Text>
                </Col>
                <Col span={2}>
                    <Text className="text-sm font-medium ">Status</Text>
                </Col>
            </Row>
        </Content>
        <Flex vertical className="w-full">
            <FieldArray name="data">
                {({ remove }) => (
                    <>
                        {values.map((_: any, index: number) => (
                            <Row key={index} className="xl:flex-row xl:items-center" gutter={10}>
                                <EditGuidelineForm index={index} templateData={data} />
                                {index > 0 && (
                                    <DeleteOutlined
                                        onClick={() => remove(index)}
                                        className="pl-3 text-xl text-bgOrange2"
                                    />
                                )}
                                {index === 0 && (
                                    <DeleteOutlined
                                        onClick={() => remove(index)}
                                        className="pl-3 text-xl text-bgOrange2"
                                        style={{ visibility: 'hidden' }}
                                    />
                                )}
                            </Row>
                        ))}
                    </>
                )}
            </FieldArray>
            <FieldArray name="data">
                {({ push }) =>
                    values.length < 10 && (
                        <Flex className="justify-center cursor-pointer" gap={6}>
                            <Flex gap={3} justify="space-between w-full">
                                <ReactSVG className="mt-4" src={add} />

                                <Text
                                    className="mt-3 font-medium text-bgOrange2 "
                                    onClick={() =>
                                        push({
                                            days: '',
                                            sms: false,
                                            email: false,
                                            notification: false,
                                            actionDate: '',
                                            templet: {
                                                email: {
                                                    emailId: '',
                                                    subject: '',
                                                    body: '',
                                                    index: '',
                                                },
                                                sms: {
                                                    mobileNo: '',
                                                    body: '',
                                                },
                                            },

                                            invoiceId: values[0].invoiceId,
                                        })
                                    }
                                >
                                    Add another condition
                                </Text>
                            </Flex>
                        </Flex>
                    )
                }
            </FieldArray>
        </Flex>
        <Button htmlType="submit" type="primary" className="mt-5 w-fit" danger loading={isLoading}>
            Update Guideline
        </Button>
    </Flex>
);

export default EditGuideline;
