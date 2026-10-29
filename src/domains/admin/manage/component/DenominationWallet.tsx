import React from 'react';

import { WalletOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Typography } from 'antd';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import DenominationInput from './DenominationInput';
import useWalletDenominations from '../hooks/useWalletDenominations';

const { Text, Title } = Typography;

const MAX_DENOMINATIONS = 6;

const DenominationWallet: React.FC = () => {
    const { denomination, isLoading, updateWalletDenominations } = useWalletDenominations();

    return (
        <div className="max-w-2xl mx-auto mt-6 px-4">
            <Formik
                enableReinitialize
                initialValues={{ denominations: (denomination ?? []).map(String) }}
                validationSchema={Yup.object().shape({
                    denominations: Yup.array()
                        .of(Yup.number().positive('Each amount must be positive'))
                        .max(
                            MAX_DENOMINATIONS,
                            `Maximum ${MAX_DENOMINATIONS} denominations allowed`
                        )
                        .test('unique', 'Duplicate values are not allowed', values =>
                            !values ? true : new Set(values).size === values.length
                        ),
                })}
                onSubmit={(values, { setSubmitting }) => {
                    const parsedValues = values.denominations.map(val => Number(val));
                    updateWalletDenominations(parsedValues);
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
                                <WalletOutlined className="text-xl text-red-500" />
                                <Title level={4} className="!mb-0">
                                    Wallet Denominations
                                </Title>
                            </Flex>
                            <Text type="secondary" className="text-sm">
                                Set the preset amounts users can select when adding money to their
                                Peko Wallet.
                            </Text>

                            <Divider className="my-5" />

                            <Flex justify="space-between" align="center" className="mb-4">
                                <Text className="text-sm font-medium text-gray-700">
                                    Preset Amounts
                                </Text>
                                <Text
                                    type={
                                        values.denominations.length >= MAX_DENOMINATIONS
                                            ? 'danger'
                                            : 'secondary'
                                    }
                                    className="text-xs"
                                >
                                    {values.denominations.length} / {MAX_DENOMINATIONS} added
                                </Text>
                            </Flex>

                            <DenominationInput />

                            <Divider className="my-5" />

                            <Flex justify="flex-end">
                                <Button
                                    danger
                                    type="primary"
                                    htmlType="submit"
                                    loading={isLoading || isSubmitting}
                                    disabled={values.denominations.length === 0}
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

export default DenominationWallet;
