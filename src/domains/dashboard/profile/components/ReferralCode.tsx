import { lazy, Suspense, useState } from 'react';

import { CopyOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { showToast } from '@src/slices/apiSlice';

import { useProfileProgressApi } from '../hooks/useProfileProgressApi';
import { socialPaths } from '../utils/data';

const ReferralCodeModal = lazy(() => import('./ReferralCodeModal'));

const ReferralCode = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const [openModal, setopenModal] = useState(false);
    const { progressData } = useProfileProgressApi();
    const dispatch = useDispatch();

    const handleCopy = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                dispatch(
                    showToast({ description: 'Text copied to clipboard!', variant: 'success' })
                );
            })
            .catch(err => {
                dispatch(showToast({ description: 'Failed to copy text', variant: 'error' }));
            });
    };

    const referralLink = progressData?.referralLink || '';
    const encodedReferralLink = encodeURIComponent(referralLink);
    const message = `Hello businesses, look at what I found! Try Peko, an all-in-one platform for SMBs to manage payments, expenses, travel, insurance, and automate operations. Start for free using my referral code: ${referralLink}`;
    const encodedMessage = encodeURIComponent(message);
    return (
        <Flex
            vertical
            className="h-full p-2 border-gray-200 border-solid sm:border sm:p-6 rounded-xl"
        >
            {/* <Skeleton paragraph={{ rows: 6 }} active loading={progressLoader}> */}
            <Typography.Title level={5}>Refer and Earn</Typography.Title>
            <Flex vertical className="mt-5" gap={40}>
                <Flex vertical gap={15}>
                    {/* <Typography.Text className="text-sm font-normal">
                            Refer a business and get INR 50 in your cashback wallet
                        </Typography.Text> */}
                    <Typography.Text className="text-sm font-semibold">
                        Copy this link and share it with your referrals
                    </Typography.Text>
                    <Flex
                        align="center"
                        className="w-full p-3 font-normal border-gray-200 border-solid rounded-xl text-md sm:border"
                    >
                        <Typography.Text ellipsis>{referralLink}</Typography.Text>
                        <CopyOutlined
                            style={{ color: colorPrimary }}
                            className="text-lg cursor-pointer ps-2"
                            onClick={() => handleCopy(referralLink)}
                        />
                    </Flex>
                    <Flex gap={25} wrap="wrap" className="my-2">
                        {socialPaths.map((element, index) => {
                            let url = '';

                            if (index === 0) {
                                // Facebook
                                url = `${element.path}${encodedReferralLink}&quote=${encodedMessage}`;
                            } else if (index === 1 || index === 3) {
                                // Twitter or WhatsApp
                                url = `${element.path}${encodedMessage}`;
                            } else if (index === 2) {
                                // LinkedIn
                                url = `${element.path}${encodedReferralLink}&title=${encodedMessage}`;
                            }

                            return (
                                <Link to={url} target="_blank" key={index}>
                                    <ReactSVG
                                        className="transition duration-300 transform cursor-pointer hover:scale-110"
                                        beforeInjection={svg => {
                                            svg.classList.add('svg-class-name');
                                            svg.setAttribute('style', 'width: 25px; height: 25px');
                                        }}
                                        src={element.icon}
                                    />
                                </Link>
                            );
                        })}
                    </Flex>
                    <Flex vertical gap={20}>
                        <Typography.Text className="text-sm font-semibold">
                            Invite by email
                        </Typography.Text>
                        <Flex className="w-full" justify="start">
                            <Button
                                key="submit"
                                type="default"
                                danger
                                onClick={() => setopenModal(true)}
                            >
                                Send email
                            </Button>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            {/* </Skeleton> */}
            <Suspense>
                {openModal && (
                    <ReferralCodeModal
                        isOpen={openModal}
                        handleCancel={() => setopenModal(false)}
                    />
                )}
            </Suspense>
        </Flex>
    );
};

export default ReferralCode;
