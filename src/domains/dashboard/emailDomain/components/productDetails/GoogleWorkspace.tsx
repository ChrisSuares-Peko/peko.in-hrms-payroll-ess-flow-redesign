import React, { useRef, useState } from 'react';

import { Button, Col, Flex, Image, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import banner from '@domains/dashboard/emailDomain/assets/banner.png';
import workspaces from '@domains/dashboard/emailDomain/assets/googleworkspace1.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import { EmailDomain } from '../../types/types';
import { workspace } from '../../utils/index';
import TermsModal from '../TermsModal';
import WorkspaceForm from '../WorkspaceForm';
import WorkspaceList from '../WorkspaceList';

const { Text, Paragraph } = Typography;

interface props {
    setFormData: (data: any) => void;
    formData: any;
    setIsFormSubmitted: (data: any) => void;
    productData?: EmailDomain | null;
}

const GoogleWorkspace = ({ setFormData, formData, setIsFormSubmitted, productData }: props) => {
    const formRef = useRef<HTMLDivElement>(null);
    const { sm } = useScreenSize();
    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const navigate = useNavigate();
    const topRowData = workspace.slice(0, 4); // First 4 items
    const bottomRowData = workspace.slice(4);
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <Row
                gutter={[16, 16]} // Add gutter for spacing
                className="mt-3"
                justify="space-between"
            >
                <Col xs={24} lg={24} xl={10}>
                    <Image
                        src={workspaces}
                        preview={false}
                        style={{ width: '30%', height: 'auto', maxHeight: '9rem' }}
                    />
                    <div className="flex-grow w-full sm:w-[33.5rem] mt-4">
                        <Text className="text-2xl sm:text-3xl md:text-4xl font-normal leading-tight sm:w-full md:w-10/12 lg:w-9/12">
                            Get Gmail and many other Google products for your business
                        </Text>
                        <Paragraph className="w-full mt-6 mb-5 text-sm sm:text-base lg:w-11/12 text-black">
                            The service boasts of a comprehensive suite of powerful apps to
                            streamline workflow, collaborate seamlessly, and enhance efficiency.
                            Equip your team with world-class productivity tools and boost
                            performance like never before.
                        </Paragraph>
                        <Row gutter={[15, 15]}>
                            <Col xs={12} sm={12}>
                                <Button
                                    danger
                                    size={sm ? 'middle' : 'small'}
                                    type="primary"
                                    className="w-full h-10 mt-8 text-xs font-normal sm:text-sm sm:font-medium"
                                    onClick={scrollToForm}
                                >
                                    Get Google Workspace
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
                <Col xs={24} md={24} lg={24} xl={12} className="flex justify-center ">
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
            <Flex justify="center" align="center" className="mt-20">
                <Text className="text-xl font-medium">Google Workspace Products</Text>
            </Flex>
            <Row className="mt-5 xxl:px-32" gutter={[16, 16]}>
                {topRowData.map((data, index) => (
                    <Col xs={12} sm={12} md={12} lg={12} xl={6} xxl={6} key={index}>
                        <WorkspaceList
                            image={data.image}
                            name={data.name}
                            description={data.description}
                        />
                    </Col>
                ))}
            </Row>

            <Flex justify="center" className="mt-4">
                <Row gutter={[30, 20]} justify="center" style={{ width: 'fit-content' }}>
                    {bottomRowData.map((data, index) => (
                        <Col xs={12} sm={12} md={8} lg={8} xl={8} xxl={8} key={index}>
                            <WorkspaceList
                                image={data.image}
                                name={data.name}
                                description={data.description}
                            />
                        </Col>
                    ))}
                </Row>
            </Flex>
            <Flex
                justify="center"
                align="center"
                className="bg-[#FFFEF4] my-14 py-4 px-8 rounded-lg text-center w-fit max-w-max mx-auto"
            >
                <Text className="text-[.95rem] font-normal max-w-4xl">
                    All the plans require a 1-year commitment. You can choose to pay monthly or
                    yearly.
                    <br />
                    Subscription cannot be canceled or downgraded during this period. License
                    upgrades are allowed anytime.
                    <Button
                        type="link"
                        className="text-red-500"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <span className="text-red-500 underline -ml-3 whitespace-nowrap">
                            Learn More
                        </span>
                    </Button>
                </Text>
            </Flex>
            <TermsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <Flex justify="start" align="center" className="mt-20">
                <Text className="xxl:px-64 text-xl font-medium">Get Google Workspace Now!</Text>
            </Flex>
            <Flex className="mt-5 xxl:px-64" ref={formRef}>
                {/* TODO: Add form for Google Workspace */}
                <WorkspaceForm
                    isGoogleWorkSpace
                    setFormData={setFormData}
                    formData={formData}
                    setIsFormSubmitted={setIsFormSubmitted}
                />
            </Flex>
        </>
    );
};

export default GoogleWorkspace;
