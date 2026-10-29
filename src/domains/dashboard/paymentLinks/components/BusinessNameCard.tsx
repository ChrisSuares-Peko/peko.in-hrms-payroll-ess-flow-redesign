import { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Image, Input, Typography } from 'antd';
import { Formik } from 'formik';

import BuildingIcon from '../assets/icons/building.svg';
import { businessNameSchema } from '../schema/onboardingSchema';

interface Props {
    value: string;
    onChange: (val: string) => void;
    onEditingChange?: (editing: boolean) => void;
}


const BusinessNameCard = ({ value, onChange, onEditingChange }: Props) => {
    const [editing, setEditing] = useState(false);

    const setEditingState = (val: boolean) => {
        setEditing(val);
        onEditingChange?.(val);
    };

    return (
        <Card
            bordered={false}
            className="rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)] overflow-hidden"
            styles={{ body: { padding: '12px 16px', background: '#F9FBFF' } }}
        >
            {editing ? (
                <Formik
                    initialValues={{ businessName: value }}
                    validationSchema={businessNameSchema}
                    onSubmit={values => {
                        onChange(values.businessName.trim());
                        setEditingState(false);
                    }}
                    enableReinitialize
                >
                    {({ values, errors, touched, setFieldValue, setFieldTouched, handleSubmit }) => (
                        <Flex align="center" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                className="rounded-lg"
                                style={{ width: 32, height: 32, background: '#EFF4FA', flexShrink: 0 }}
                            >
                                <Image src={BuildingIcon} width={18} height={18} preview={false} style={{ color: '#64748B' }} />
                            </Flex>
                            <Flex vertical gap={6} className="flex-1">
                                <Typography.Text className="text-[11px]">Business Name</Typography.Text>
                                <Input
                                    value={values.businessName}
                                    onChange={e => setFieldValue('businessName', e.target.value)}
                                    onBlur={() => setFieldTouched('businessName', true)}
                                    className="rounded-lg !text-[13px]"
                                    autoFocus
                                    maxLength={100}
                                    status={touched.businessName && errors.businessName ? 'error' : ''}
                                    onPressEnter={() => handleSubmit()}
                                />
                                {touched.businessName && errors.businessName ? (
                                    <Typography.Text className="text-xs text-red-500">
                                        {errors.businessName}
                                    </Typography.Text>
                                ) : null}
                                <Flex gap={8}>
                                    <Button type="primary" danger size="small" onClick={() => handleSubmit()}>
                                        Save
                                    </Button>
                                    <Button size="small" onClick={() => setEditingState(false)}>Cancel</Button>
                                </Flex>
                            </Flex>
                        </Flex>
                    )}
                </Formik>
            ) : (
                <Flex justify="space-between" align="center" className='rounded-xl'>
                    <Flex align="center" gap={12}>
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-xl"
                            style={{ width: 32, height: 32, background: '#EFF4FA', flexShrink: 0 }}
                        >
                                                    <Image src={BuildingIcon} width={18} height={18} preview={false} style={{ color: '#64748B' }} />

                        </Flex>
                        <Flex vertical gap={1}>
                            <Typography.Text className="text-[11px] leading-[1.35]">
                                Business Name
                            </Typography.Text>
                            <Typography.Text className="text-[14px] font-semibold leading-[1.35] text-[#1F2A44]">
                                {value || '–'}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: '#FF4D4F', fontSize: 11 }} />}
                        style={{ color: '#FF4D4F' }}
                        className="!h-auto !px-1 !text-[12px] !font-medium"
                        onClick={() => setEditingState(true)}
                    >
                        Edit
                    </Button>
                </Flex>
            )}
        </Card>
    );
};

export default BusinessNameCard;
