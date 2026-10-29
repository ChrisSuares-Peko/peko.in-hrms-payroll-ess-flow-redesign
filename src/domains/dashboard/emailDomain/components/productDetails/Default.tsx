import React, { useRef } from 'react';

import { Button, Col, Flex, Image, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import banner from '@domains/dashboard/emailDomain/assets/banner.png';
import ms365 from '@domains/dashboard/emailDomain/assets/microsoft365.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import { EmailDomain } from '../../types/types';
import { Microsoft365 } from '../../utils/index';
import WorkspaceForm from '../WorkspaceForm';
import WorkspaceList from '../WorkspaceList';

const { Text, Paragraph } = Typography;
interface props {
    setFormData: (data: any) => void;
    formData: any;
    setIsFormSubmitted: (data: any) => void;
    productData?: EmailDomain | null;
}

const Default = ({ setFormData, formData, setIsFormSubmitted, productData }: props) => {
    const formRef = useRef<HTMLDivElement>(null);
    const { sm } = useScreenSize();
    const navigate = useNavigate();

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <>
            <Row
                gutter={[16, 16]} // Add spacing between columns
                className="mt-3"
                justify="space-between"
            >
                <Col xs={24} lg={24} xl={10}>
                    <Image
                        src={ms365}
                        preview={false}
                        style={{ width: '30%', height: 'auto', maxHeight: '9rem' }}
                    />
                    <div className="flex-grow w-full sm:w-[33.5rem] mt-4">
                        <Text className="text-2xl sm:text-3xl md:text-4xl font-normal leading-tight sm:w-full md:w-10/12 lg:w-9/12">
                            Discover endless possibilities to drive business growth with Microsoft
                            365
                        </Text>
                        <Paragraph className="w-full mt-6 mb-5 text-sm sm:text-base lg:w-11/12 text-black">
                            The service offers cutting-edge products built to revolutionize the way
                            you work. Share resources effortlessly, streamline workflows, and ensure
                            that data is protected. Leverage the integrated communication tools to
                            engage with your team and collaborate in real time.
                        </Paragraph>
                        <Paragraph className="w-full mt-6 mb-5 text-sm sm:text-base lg:w-11/12 text-black">
                            Boost efficiency, save time, and maximize your productivity with the
                            powerful Microsoft products.
                        </Paragraph>
                        <Row gutter={[15, 15]}>
                            <Col xs={12} sm={12}>
                                <Button
                                    data-testid="get-started-now"
                                    danger
                                    size={sm ? 'middle' : 'small'}
                                    type="primary"
                                    className="w-full h-10 mt-8 text-xs font-normal rounded-sm sm:text-sm sm:font-medium"
                                    onClick={scrollToForm}
                                >
                                    Get Microsoft 365
                                </Button>
                            </Col>
                            <Col xs={12} sm={12}>
                                <Button
                                    danger
                                    size={sm ? 'middle' : 'small'}
                                    onClick={() =>
                                        navigate(
                                            `${paths.dashboard.moreServices}/${paths.emailDomain.index}/${productData?.name}/${paths.emailDomain.historyPage}?id=${productData?.id}`
                                        )
                                    }
                                    type="default"
                                    className="w-full h-10 mt-8 text-xs font-normal sm:text-sm sm:font-medium"
                                >
                                    Order History
                                </Button>
                            </Col>
                        </Row>
                    </div>
                </Col>
                <Col xs={24} md={24} lg={24} xl={12} className="flex justify-center">
                    <Image
                        src={banner}
                        preview={false}
                        style={{
                            width: 'auto',
                            height: 'auto',
                            maxHeight: '45rem',
                            maxWidth: '100%',
                        }}
                    />
                </Col>
            </Row>
            <Flex justify="center" align="center" className="mt-10">
                <Text className="text-xl font-medium ">Microsoft 365 Products</Text>
            </Flex>
            <Row className="mt-5 xxl:px-32" gutter={[30, 16]} justify="center">
                {Microsoft365.map((data, index) => (
                    <Col xs={12} sm={12} md={12} lg={12} xl={6} xxl={6} key={index}>
                        <WorkspaceList
                            image={data.image}
                            name={data.name}
                            description={data.description}
                        />
                    </Col>
                ))}
            </Row>
            <Flex justify="center" align="center" className="mt-14">
                <Text className="xxl:px-64 text-xl font-medium">Get Microsoft 365 Now!</Text>
            </Flex>
            <Flex className="mt-5 xxl:px-64" data-testid="form-section" ref={formRef}>
                {/* TODO: Add form for default product */}
                <WorkspaceForm
                    setFormData={setFormData}
                    formData={formData}
                    setIsFormSubmitted={setIsFormSubmitted}
                />
            </Flex>
        </>
    );
};

export default Default;
