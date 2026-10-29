import { UserOutlined } from '@ant-design/icons';
import { Avatar, Col, Flex, Progress, Row, Skeleton, Typography, theme } from 'antd';
import { ReactSVG } from 'react-svg';

import SuccessIcon from '@assets/icons/SuccessIcon.svg';
import SuccessIconMobile from '@assets/icons/SuccessIconMobile.svg';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { useCompanyNameFallback } from '../hooks/useCompanyNameFallback';
import { useProfileProgressApi } from '../hooks/useProfileProgressApi';

const ProfileInfo = () => {
    const { data, isLoading } = useAppSelector(state => state.reducer.basicInfo);
    const { packageName } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const { progressData, progressLoader } = useProfileProgressApi();
    const { applicationId } = useCompanyNameFallback();
    const isFreelancer = user?.accountType === 'freelancer';
    const displayName = isFreelancer
        ? user?.contactPersonName || 'Registration Pending'
        : data?.name || (applicationId ? `${applicationId}` : 'Registration Pending');
    const progressPercentage = Number(
        (
            (progressData?.addressDetailsProgress ?? 0) +
            (progressData?.bankDetailsProgress ?? 0) +
            (progressData?.basicInfoProgress ?? 0) +
            (progressData?.companyInfoProgress ?? 0) +
            (progressData?.companyDocProgress ?? 0)
        ).toFixed(0)
    );
    const {
        token: { gold5, colorPrimary },
    } = theme.useToken();
    const { sm } = useScreenSize();
    return (
        <Row align="middle">
            <Col xs={24} xl={11} className="w-full">
                <Skeleton active avatar loading={isLoading}>
                    <Flex gap={20} align="center">
                        <Avatar
                            src={data?.logo}
                            alt="Profile"
                            shape="square"
                            size={64}
                            draggable={false}
                            className="bg-[#ffeeee]"
                        >
                            {data?.name ? (
                                <Typography.Text
                                    style={{ color: colorPrimary }}
                                    className="text-4xl font-bold"
                                >
                                    {data.name.slice(0, 1).toUpperCase()}
                                </Typography.Text>
                            ) : (
                                <UserOutlined style={{ color: colorPrimary, fontSize: 28 }} />
                            )}
                        </Avatar>

                        <Flex vertical>
                            <Flex gap={10} align="center">
                                <Typography.Text className="text-lg font-semibold">
                                    {displayName}
                                </Typography.Text>
                                <ReactSVG src={sm ? SuccessIcon : SuccessIconMobile} />
                            </Flex>
                            <Typography.Text className="font-normal text-gray-400 ">
                            {packageName} Account
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </Skeleton>
            </Col>
            <Col xs={24} xl={13} className=" w-full">
                <Skeleton active avatar loading={progressLoader}>
                    {sm ? (
                        <Flex vertical justify="center" className=" pr-6 xl:pl-10 ">
                            <Typography.Text className="text-sm font-semibold text-black ">
                                Profile Strength: {progressData?.strength}
                            </Typography.Text>
                            {progressPercentage === 100 ? (
                                <Progress percent={progressPercentage} />
                            ) : (
                                <Progress percent={progressPercentage} strokeColor={gold5} />
                            )}

                            <Typography.Text className=" text-[11px] text-gray-400 font-normal">
                                Tips: {progressData?.tips}
                            </Typography.Text>
                        </Flex>
                    ) : (
                        <Flex vertical gap={10} justify="center" className="mt-10 xl:pl-10 ">
                            <Typography.Text className="text-sm font-normal text-black">
                                Profile Strength: {progressData?.strength}
                            </Typography.Text>
                            <Flex vertical className="w-full p-4  bg-tagColor rounded-[3px]">
                                {progressPercentage === 100 ? (
                                    <Progress percent={progressPercentage} />
                                ) : (
                                    <Progress percent={progressPercentage} strokeColor={gold5} />
                                )}
                                <Typography.Text className=" text-[.65rem] text-zinc-500 font-normal">
                                    Tips: {progressData?.tips}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    )}
                </Skeleton>
            </Col>
        </Row>
    );
};

export default ProfileInfo;
