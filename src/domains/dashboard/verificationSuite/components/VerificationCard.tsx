import React, { useState } from 'react';

import { Button, Flex, Image, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
// import { ReactSVG } from 'react-svg';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import PanVerifyModal from './PanVerifyModal';

type cardProps = {
    title: string;
    desc: string;
    logo: string;
    inputComponents: any;
    accessKeys: string;
    serviceName: string;
    exhausted?: boolean;
    maxLimit?: number;
    onModalClose?: () => void;
};

const { Text } = Typography;



const VerificationCard = ({
    title,
    desc,
    logo,
    inputComponents,
    accessKeys,
    serviceName,
    exhausted,
    maxLimit,
    onModalClose,
}: cardProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();

    const handleModalCancel = () => {
        setIsOpen(false);
        onModalClose?.();
    };

    const handleVerifyClick = () => {
        if (exhausted) {
            dispatch(
                showToast({
                    description:
                        maxLimit === 0
                            ? "Your plan doesn't include verification services. Upgrade or purchase an add-on to continue."
                            : `You've used all ${maxLimit} verification requests. Purchase an add-on or upgrade to continue.`,
                    variant: 'error',
                })
            );
            return;
        }
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event(accessKeys);
        }
        setIsOpen(true);
    };

    return (
        <Content
            className="relative h-full p-6 pt-5 pb-15 rounded-xl _scale_on_hover hover:scale-105 transition-transform duration-300"
            style={{ boxShadow: '0px 1.4px 14px rgba(0, 0, 0, 0.1)' }}
        >
            <Flex justify="space-between" className="h-full" vertical>
                <Flex vertical>
                    <Flex justify="space-between">
                        <Image className="max-w-[60px] max-h-[60px]" preview={false} src={logo} />
                    </Flex>
                    <Text className="text-xl font-medium mt-5">{title}</Text>
                    <Text className="text-gray-500 mt-2">{desc}</Text>
                </Flex>
                <Button
                    type="default"
                    danger
                    size="middle"
                    className="text-xs md:px-5 md:text-sm mt-4 rounded-lg "
                    onClick={handleVerifyClick}
                >
                    Verify Now
                </Button>
            </Flex>
            {isOpen && (
                <PanVerifyModal
                    open={isOpen}
                    handleCancel={handleModalCancel}
                    inputComponents={inputComponents}
                    title={title}
                    accessKeys={accessKeys}
                    serviceName={serviceName}
                />
            )}
        </Content>
    );
};

export default VerificationCard;
