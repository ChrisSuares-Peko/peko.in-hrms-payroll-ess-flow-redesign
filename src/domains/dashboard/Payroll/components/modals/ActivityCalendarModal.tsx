
import { useEffect, useState } from 'react';

import { Modal, Button, Flex, Image } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@src/assets/animation/Birthday-Loader.json';
import image from '@src/assets/svg/brithdayImage.png';
import confetti from '@src/assets/svg/confetti.png';

interface ModalProps {
    open: boolean;
    handleCancel: () => void;
    holiDayData?: any;
}

export const ActivityCalendarModal = ({ open, handleCancel, holiDayData }: ModalProps) => {
    const navigate = useNavigate();
    const [showLottie, setShowLottie] = useState(false);
    // const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        if (open && holiDayData?.title.toLowerCase().includes('birthday')) {
            setShowLottie(true);
            const timer = setTimeout(() => {
                setShowLottie(false);
                // setShowContent(true);
            }, 0);

            return () => {
                clearTimeout(timer);
                setShowLottie(false);
                // setShowContent(false);
            };
        }

        return () => {};
    }, [open, holiDayData]);

    const handleOnClose = () => {
        // setShowContent(false);
        setShowLottie(false);
        handleCancel();
    };

    const defaultOptions = {
        loop: false,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };
    const isBirthday = holiDayData?.title.toLowerCase().includes('birthday');

    const birthdayFooterContent = (
        <>
            <Flex align="center" justify="center" className="pt-3 w-96 relative">
                <Image src={confetti} className="w-60" preview={false} />
                <Flex vertical gap={2} className="absolute sm:block p-4 max-w-52">
                    <Image src={image} className="w-full" preview={false} />
                </Flex>
            </Flex>
            <Flex justify="center" gap={10}>
                <Button type="primary" danger onClick={() => navigate('/gift-cards')}>
                    Present a Gift Card
                </Button>
                <Button key="edit" danger onClick={handleOnClose}>
                    Cancel
                </Button>
            </Flex>
        </>
    );

    const regularFooterContent = (
        <Button key="edit" danger onClick={handleOnClose}>
            OK
        </Button>
    );

    return (
        <Modal
            width={420}
            title={
                isBirthday ? <Flex justify="center">{holiDayData?.title}</Flex> : holiDayData?.title
            }
            open={open}
            onCancel={handleOnClose}
            footer={isBirthday ? birthdayFooterContent : regularFooterContent}
        >
            {showLottie && (
                <Flex justify="center" style={{ height: '200px', marginBottom: '' }}>
                    <Lottie options={defaultOptions} height={200} width={200} />
                </Flex>
            )}
        </Modal>
    );
};
