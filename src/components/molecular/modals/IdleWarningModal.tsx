import React, { useEffect, useState } from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

import { handleLogout, triggerSessionExpired } from '@src/services/handleLogout';

const { Text } = Typography;

interface IdleWarningModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    handleSubmit: () => void;
    isLoading: boolean;
}
const IdleWarningModal = ({
    isOpen,
    handleCancel,
    isLoading,
    handleSubmit,
}: IdleWarningModalProps) => {
    const [counter, setCounter] = useState(60); /// modal timeout seconds
    useEffect(() => {
        let countdown: string | number | NodeJS.Timeout | undefined;
        if (isOpen) {
            countdown = setInterval(() => {
                setCounter(prevCounter => {
                    if (prevCounter <= 1) {
                        clearInterval(countdown);
                        triggerSessionExpired();
                        return 0;
                    }
                    return prevCounter - 1;
                });
            }, 1000);
        }
        return () => {
            setCounter(60);
            clearInterval(countdown);
        };
    }, [isOpen]);
    const handleContinue = () => {
        handleCancel();
        setCounter(60); // Reset the counter
    };
    return (
        <Modal
            children={
                <Flex vertical className="">
                    <Text className="text-lg font-medium">Still with us?</Text>
                    <Text className=" mt-3 ">
                        {`Privacy is essential, and you've been gone a while. We will log you out in following seconds unless you confirm you're still with us.`}
                    </Text>
                    <Text className="text-5xl font-medium my-6">
                        {`${Math.floor(counter / 60).toString().length <= 1 ? '0' : ''}${Math.floor(counter / 60)}`}
                        :{`${(counter % 60).toString().length <= 1 ? '0' : ''}${counter % 60}`}
                    </Text>
                </Flex>
            }
            open={isOpen}
            onCancel={handleCancel}
            closeIcon={null}
            centered
            width={340}
            footer={[
                <Flex className=" w-full mt-8" justify="space-between" gap={10} key="">
                    <Button
                        key="back"
                        type="primary"
                        danger
                        onClick={handleContinue}
                        className=" rounded-sm w-full"
                    >
                        Stay with us
                    </Button>
                    <Button
                        key="submit"
                        loading={isLoading}
                        onClick={() => {
                            handleLogout();
                        }}
                        className=" rounded-sm"
                    >
                        Logout
                    </Button>
                </Flex>,
            ]}
        />
    );
};

export default IdleWarningModal;
