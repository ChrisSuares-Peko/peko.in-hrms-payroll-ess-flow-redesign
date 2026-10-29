import React from 'react';

import { Button, Card, Divider, Flex, Form, InputNumber, Skeleton, Switch, Typography } from 'antd';
import { FieldArray, Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ServiceConfig } from '../../api/companyIncorporation';
import {
    ConfigFormValues,
    useCompanyIncorporationConfig,
} from '../../hooks/useCompanyIncorporationConfig';

const { Title, Text } = Typography;

const validationSchema = Yup.object({
    incorporationFee: Yup.number().min(0, 'Must be ≥ 0').required('Required'),
    services: Yup.array().of(
        Yup.object({
            name: Yup.string().required('Required'),
            description: Yup.string().required('Required'),
            price: Yup.number().min(0, 'Must be ≥ 0').required('Required'),
        })
    ),
});

const CompanyIncorporationConfig: React.FC = () => {
    const { config, isLoading, isSaving, handleSave } = useCompanyIncorporationConfig();

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    const initialValues: ConfigFormValues = {
        incorporationFee: config?.incorporationFee ?? 10000,
        services: config?.services ?? [],
    };

    return (
        <Flex vertical gap={20}>
            <Title level={4} style={{ margin: 0 }}>
                Company Incorporation — Pricing Configuration
            </Title>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={handleSave}
            >
                {({ values, setFieldValue, handleSubmit, errors, touched }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        {/* Base Incorporation Fee */}
                        <Card style={{ marginBottom: 20, borderRadius: 12 }}>
                            <Title level={5} style={{ marginBottom: 16 }}>
                                Base Incorporation Fee
                            </Title>
                            <Form.Item
                                label="Fee (₹)"
                                validateStatus={
                                    touched.incorporationFee && errors.incorporationFee
                                        ? 'error'
                                        : ''
                                }
                                help={touched.incorporationFee && errors.incorporationFee}
                                style={{ marginBottom: 0 }}
                            >
                                <InputNumber
                                    min={0}
                                    value={values.incorporationFee}
                                    onChange={val => setFieldValue('incorporationFee', val ?? 0)}
                                    formatter={val =>
                                        val === undefined || val === null
                                            ? '₹ '
                                            : `₹ ${formatNumberWithLocalString(val, 0, 0)}`
                                    }
                                    parser={val => Number(val!.replace(/₹\s?|(,*)/g, ''))}
                                    className="w-full"
                                    size="large"
                                />
                            </Form.Item>
                        </Card>

                        {/* Post-Incorporation Services */}
                        <Card style={{ borderRadius: 12 }}>
                            <Title level={5} style={{ marginBottom: 16 }}>
                                Post-Incorporation Services
                            </Title>

                            <FieldArray name="services">
                                {() => (
                                    <div>
                                        {values.services.map((svc: ServiceConfig, idx: number) => (
                                            <div key={svc.id}>
                                                {idx > 0 && (
                                                    <Divider style={{ margin: '16px 0' }} />
                                                )}

                                                <Flex
                                                    justify="space-between"
                                                    align="center"
                                                    style={{ marginBottom: 12 }}
                                                >
                                                    <Text
                                                        type="secondary"
                                                        style={{
                                                            fontSize: 12,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em',
                                                        }}
                                                    >
                                                        Service {idx + 1}
                                                    </Text>
                                                    <Flex align="center" gap={8}>
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 13 }}
                                                        >
                                                            Active
                                                        </Text>
                                                        <Switch
                                                            checked={svc.isActive}
                                                            onChange={val =>
                                                                setFieldValue(
                                                                    `services[${idx}].isActive`,
                                                                    val
                                                                )
                                                            }
                                                        />
                                                    </Flex>
                                                </Flex>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <TextInput
                                                        name={`services[${idx}].name`}
                                                        label="Service Name"
                                                        placeholder="e.g. GST Registration"
                                                        type="text"
                                                    />
                                                    <Form.Item
                                                        label="Price (₹)"
                                                        validateStatus={
                                                            (touched.services as any)?.[idx]
                                                                ?.price &&
                                                            (errors.services as any)?.[idx]?.price
                                                                ? 'error'
                                                                : ''
                                                        }
                                                        help={
                                                            (touched.services as any)?.[idx]
                                                                ?.price &&
                                                            (errors.services as any)?.[idx]?.price
                                                        }
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <InputNumber
                                                            min={0}
                                                            value={svc.price}
                                                            onChange={val =>
                                                                setFieldValue(
                                                                    `services[${idx}].price`,
                                                                    val ?? 0
                                                                )
                                                            }
                                                            formatter={val =>
                                                                val === undefined || val === null
                                                                    ? '₹ '
                                                                    : `₹ ${formatNumberWithLocalString(val, 0, 0)}`
                                                            }
                                                            parser={val =>
                                                                Number(
                                                                    val!.replace(/₹\s?|(,*)/g, '')
                                                                )
                                                            }
                                                            className="w-full"
                                                        />
                                                    </Form.Item>
                                                </div>

                                                <TextInput
                                                    name={`services[${idx}].description`}
                                                    label="Description"
                                                    placeholder="Short description shown to the customer"
                                                    type="text"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </FieldArray>
                        </Card>

                        <Flex justify="flex-end" style={{ marginTop: 20 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSaving}
                                size="large"
                                danger
                            >
                                Save Configuration
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default CompanyIncorporationConfig;
