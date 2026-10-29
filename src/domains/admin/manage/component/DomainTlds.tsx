import React from 'react';

import { GlobalOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Typography } from 'antd';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import TldInput from './TldInput';
import useDomainTlds from '../hooks/useDomainTlds';

const { Text, Title } = Typography;

const MAX_TLDS = 6;

const DomainTlds: React.FC = () => {
    const { tlds, isLoading, saveDomainTlds } = useDomainTlds();

    return (
        <div className="max-w-2xl mx-auto mt-6 px-4">
            <Formik
                enableReinitialize
                initialValues={{ tlds }}
                validationSchema={Yup.object().shape({
                    tlds: Yup.array()
                        .of(Yup.string().matches(/^[a-z0-9.]+$/, 'Invalid TLD format'))
                        .max(MAX_TLDS, `Maximum ${MAX_TLDS} TLDs allowed`)
                        .test('unique', 'Duplicate values are not allowed', values =>
                            !values ? true : new Set(values).size === values.length
                        ),
                })}
                onSubmit={(values, { setSubmitting }) => {
                    saveDomainTlds(values.tlds);
                    setSubmitting(false);
                }}
            >
                {({ handleSubmit, values, isSubmitting }) => (
                    <Form onSubmit={handleSubmit}>
                        <Card
                            styles={{ body: { padding: '28px 32px' } }}
                            className="shadow-sm rounded-2xl border border-gray-200"
                        >
                            <Flex align="center" gap={10} className="mb-1">
                                <GlobalOutlined className="text-xl text-red-500" />
                                <Title level={4} className="!mb-0">
                                    Popular Domain TLDs
                                </Title>
                            </Flex>
                            <Text type="secondary" className="text-sm">
                                Set the TLDs shown first when corporates search for a domain.
                            </Text>

                            <Divider className="my-5" />

                            <Flex justify="space-between" align="center" className="mb-4">
                                <Text className="text-sm font-medium text-gray-700">
                                    Popular TLDs
                                </Text>
                                <Text
                                    type={values.tlds.length >= MAX_TLDS ? 'danger' : 'secondary'}
                                    className="text-xs"
                                >
                                    {values.tlds.length} / {MAX_TLDS} added
                                </Text>
                            </Flex>

                            <TldInput />

                            <Divider className="my-5" />

                            <Flex justify="flex-end">
                                <Button
                                    danger
                                    type="primary"
                                    htmlType="submit"
                                    loading={isLoading || isSubmitting}
                                    disabled={values.tlds.length === 0}
                                    className="px-8"
                                >
                                    Save Changes
                                </Button>
                            </Flex>
                        </Card>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default DomainTlds;
