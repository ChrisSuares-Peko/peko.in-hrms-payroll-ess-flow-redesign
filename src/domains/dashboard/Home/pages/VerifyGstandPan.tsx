import React from 'react';

import { Button, Col, Flex, Form, Progress, Tabs, TabsProps, Typography, theme } from 'antd';
import { Formik } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import { useProfileProgressApi } from '../../profile/hooks/useProfileProgressApi';
import { useUpdateGstandPan } from '../../profile/hooks/useUpdateGstandPanApi';
import { verifyGstandPanSchema } from '../../profile/schema';
import VerifyGstandPanForm from '../components/VerifyGstandPanForm';

interface GSTVerifyComponentProps {
    onSkip: () => void;
}

const { Text, Link } = Typography;

const Profile = ({ onSkip }: GSTVerifyComponentProps) => {
    const {
        token: { gold5 },
    } = theme.useToken();
    const { user } = useAppSelector(state => state.reducer.user);
    const { progressData } = useProfileProgressApi();
    const progressPercentage = Number(
        (
            (progressData?.addressDetailsProgress ?? 0) +
            (progressData?.bankDetailsProgress ?? 0) +
            (progressData?.basicInfoProgress ?? 0) +
            (progressData?.companyInfoProgress ?? 0)
        ).toFixed(0)
    );

    const { updateGSTandPAN } = useUpdateGstandPan();

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Company Information',
            children: (
                <Formik
                    initialValues={{
                        activity: '',
                        gstNumber: '',
                        gstDoc: null,
                        panNumber: '',
                        panDoc: null,
                        gstVerified: false,
                        panVerified: false,
                        panFormat: '',
                        gstFormat: '',
                    }}
                    validationSchema={verifyGstandPanSchema}
                    onSubmit={(values, { setFieldError }) => {
                        if (values.gstNumber && !values.gstVerified) {
                            setFieldError('gstNumber', 'GST number must be verified');
                            return;
                        }

                        if (values.panNumber && !values.panVerified) {
                            setFieldError('panNumber', 'PAN must be verified');
                            return;
                        }

                        const payload = {
                            activity: values.activity,
                            panNumber: values.panNumber,
                            gstNumber: values.gstNumber,
                            panDoc: values.panDoc ?? null,
                            gstDoc: values.gstDoc ?? null,
                            panFormat: values.panFormat,
                            gstFormat: values.gstFormat,
                            gstVerified: values.gstVerified,
                            panVerified: values.panVerified,
                        };
                        updateGSTandPAN(payload);
                    }}
                >
                    {({ handleSubmit }) => (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <VerifyGstandPanForm />
                            <Col xs={24}>
                                <Button
                                    type="primary"
                                    onClick={() => handleSubmit()}
                                    danger
                                    className="px-12 "
                                >
                                    Next
                                </Button>
                                <Link
                                    className="pl-3"
                                    style={{
                                        marginLeft: '8px',
                                        color: '#FF4D4F',
                                        fontSize: 'small',
                                    }}
                                    onClick={() => onSkip()}
                                >
                                    Skip
                                </Link>
                            </Col>
                        </Form>
                    )}
                </Formik>
            ),
        },
    ];

    return (
        <Flex vertical>
            <Flex className="w-full" justify="space-between">
                <Text className="text-lg font-medium sm:text-xl">Welcome {user?.companyName}!</Text>
            </Flex>
            <Col xs={24} xl={16} className="w-full">
                <Flex vertical justify="center" className="pr-6 mt-6">
                    <Text className="text-sm font-normal text-black" style={{ fontSize: '.85rem' }}>
                        Profile Strength: Basic
                    </Text>
                    <Flex className="mt-3">
                        {progressPercentage === 100 ? (
                            <Progress percent={progressPercentage} />
                        ) : (
                            <Progress percent={progressPercentage} strokeColor={gold5} />
                        )}
                    </Flex>
                    <Text className="mt-3 font-normal text-black" style={{ fontSize: '1rem' }}>
                        Complete the following steps to have a hassle-free, all-in-one business
                        solution experience
                    </Text>
                </Flex>
            </Col>
            <Col className="md:mt-4">
                <Tabs defaultActiveKey="1" items={items} className="sm:w-[28.75rem] xs:w-[19rem]" />
            </Col>
        </Flex>
    );
};

export default Profile;
