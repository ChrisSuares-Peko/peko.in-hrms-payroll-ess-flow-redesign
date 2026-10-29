import type { FC } from 'react';

import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import TextInput from '@src/components/atomic/inputs/TextInput';
import { paths } from '@src/routes/paths';

import { cinSchema } from '../schema';

const { Title, Text } = Typography;

const CompanyIdentification: FC = () => {
    const navigate = useNavigate();

    const handleFetch = (values: { cin: string }) => {
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        navigate(`${paths.dashboard.compliance}/${paths.compliance.confirmCompanyDetails}`, {
            state: { cinData: {}, cin: values.cin },
            replace: true,
        });
    };

    return (
        <Content>
            <Flex justify="center" className="min-h-[calc(100vh-200px)] items-center py-12 px-4">
                <div className="w-full max-w-[600px]">
                    <Formik
                        initialValues={{ cin: '' }}
                        validationSchema={cinSchema}
                        onSubmit={handleFetch}
                    >
                        {({ handleSubmit }) => (
                            <Form layout="vertical" onFinish={handleSubmit}>
                                <div className="bg-white rounded-[36px] border border-[#e6e3dd] shadow-[0px_1.56px_15.58px_4px_rgba(0,0,0,0.06)] p-6 sm:p-10 lg:p-14">
                                    <Flex vertical gap={40}>
                                        <Flex vertical align="center" gap={8} className="text-center">
                                            <Title
                                                level={3}
                                                className="!mb-0 !text-black !font-medium"
                                                style={{ fontSize: 24, lineHeight: 1.2 }}
                                            >
                                                Company Identification
                                            </Title>
                                            <Text
                                                className="!text-[#8b8b8b]"
                                                style={{ fontSize: 14, lineHeight: '22px' }}
                                            >
                                                Enter your company details to fetch information from MCA
                                            </Text>
                                        </Flex>

                                        <div className="border border-[#eaeaea] rounded-[22px] p-6">
                                            <Row gutter={[0, 0]}>
                                                <Col xs={24}>
                                                     <TextInput
                                                    name="cin"
                                                    label="Corporate Identity Number (CIN)"
                                                    type="text"
                                                    placeholder="Enter CIN"
                                                    isRequired
                                                    convertToUppercase
                                                    maxLength={21}
                                                    size="large"
                                                />
                                                </Col>
                                            </Row>
                                        </div>

                                        <Flex justify="flex-end" gap={18} className="flex-col sm:flex-row w-full">
                                            <Button
                                                size="large"
                                                className="!border-[#cbd5e1] !text-[#475569] w-full sm:w-auto"
                                                onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.landing}`)}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="primary"
                                                size="large"
                                                htmlType="submit"
                                                className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e] w-full sm:w-auto"
                                            >
                                                Fetch details from MCA
                                            </Button>
                                        </Flex>
                                    </Flex>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Flex>
        </Content>
    );
};

export default CompanyIdentification;
