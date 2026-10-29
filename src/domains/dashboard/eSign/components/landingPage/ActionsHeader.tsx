import React, { useState } from 'react';

import { Row, Typography, Col, Flex, Image, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import IFrameModal from '@components/molecular/modals/IFrameModal';
import LandingPageImg from '@domains/dashboard/eSign/assets/landing.png';
import eSignsAvailable from '@src/domains/dashboard/eSign/assets/eSignsAvailable.svg';
import eSignsLeft from '@src/domains/dashboard/eSign/assets/eSignsLeft.svg';
import eSignsUsed from '@src/domains/dashboard/eSign/assets/eSignsUsed.svg';
import useScreenSize from '@src/hooks/useScreenSize';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import DashboardCard from './DashboardCard';
import ESignLimitBar from './ESignLimitBar';
import useGetESignCount from '../../hooks/useGetESignCount';
import UploadForm from '../uploadPage/UploadForm';

type Props = {};

const ActionsHeader = (props: Props) => {
    const { md } = useScreenSize();
    const { count, pendingCount, completedCount, isLoading: countLoading } = useGetESignCount();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { addonData, isLoading: addOnLoading } = useGetAddonDetails(
        accessKeys.eSign,
        packageAccessKeys.eSign,
        false
    );
    // const eSignLeft = Math.max(0, Number(addonData?.maxLimit) - Number(count));
    const navigate = useNavigate();
    return (
        <>
            <Row justify="space-between" align="middle" className="pb-6 border-gray-200">
                <Typography.Text className="text-xl font-medium">eSign</Typography.Text>
                <Button
                    onClick={() =>
                        navigate(`${paths.dashboard.eSign}/${paths.eSign.historyPage}`)
                    }
                    danger
                >
                    Order History
                </Button>
            </Row>
            <Row className="flex flex-col md:flex-row ">
                <Col xl={10} sm={24}>
                    <Flex className="flex flex-col items-center gap-6 mb-4 text-center rounded-3xl md:mb-0 bg-stone-50 md:mr-2 py-14">
                        <Image
                            src={LandingPageImg}
                            preview={false}
                            alt="eSign"
                            width={md ? '12rem' : '12rem'}
                        />
                        <Typography.Text
                            // style={{ lineHeight: '3.8rem' }}
                            className="text-2xl font-medium leading-relaxed text-gray-700 md:text-2xl xxl:text-3xl xl:px-10 sm:px-0"
                        >
                            Experience the Power of eSign
                        </Typography.Text>
                        <Flex justify="center " align="center">
                            <Typography.Text className="px-4 text-xs leading-relaxed text-gray-500  md:text-sm xl:px-10">
                                The #1 way to digitally sign documents that are legally valid in
                                India. Sign any type of document such as Offer Letters, Invoices, Form
                                16s and more. Adopt eSign, get rid of paper and make your business
                                faster, simpler and contribute positively to the environment.
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </Col>
                <Col xl={14} sm={24}>
                    <Row className="flex flex-col items-center justify-center flex-1 space-y-4 lg:ml-0 xl:ml-6 xl:mt-0 sm:mt-6">
                        <Col className="grid w-full grid-cols-3 gap-4 sm:grid-cols-3 xl:grid-cols-3">
                            <DashboardCard
                                title="Documents sent for signing"
                                value={count?.toString() || '0'}
                                currency=""
                                bgColor="bg-magnolia"
                                icon={eSignsAvailable}
                                className="md:col-span-1 xs:col-span-3"
                            />
                            <DashboardCard
                                title="Awaiting Signatures"
                                value={pendingCount?.toString() || '0'}
                                currency=""
                                bgColor="bg-seashell"
                                icon={eSignsUsed}
                                className="md:col-span-1 xs:col-span-3"
                            />
                            <DashboardCard
                                title="Documents Signed"
                                value={completedCount?.toString() || '0'}
                                currency=""
                                bgColor="green-bg"
                                icon={eSignsLeft}
                                className="md:col-span-1 xs:col-span-3"
                            />
                        </Col>
                        <Col className="grid w-full gap-4 ">
                            <ESignLimitBar
                                addOnLoading={addOnLoading}
                                countLoading={countLoading}
                                count={count!}
                                addonData={addonData!}
                            />
                        </Col>
                        <Col className=" w-full">
                            <UploadForm eSignAvailable={(count || 0) < (addonData?.maxLimit || 0)} />
                        </Col>
                    </Row>
                </Col>
            </Row>
            {isModalVisible && (
                <IFrameModal
                    open={isModalVisible}
                    handleCancel={() => setIsModalVisible(false)}
                    videoUrl="https://www.loom.com/embed/d4f22eacea2943fbaa4dd3ca0f15dd48?sid=87aac601-1562-4ea1-ac3b-dd7792d79e10"
                    // modalTitle='How to use eSign'
                />
            )}
        </>
    );
};

export default ActionsHeader;
