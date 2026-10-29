import React, { useState } from 'react';

import { Modal, Flex, Spin } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

interface IFrameModalProps {
    open: boolean;
    handleCancel: () => void;
    modalTitle?: string;
    hideFooter?: boolean;
    videoUrl: string;
}

const IFrameModal = ({
    open,
    handleCancel,
    modalTitle = '',
    hideFooter = true,
    videoUrl,
}: IFrameModalProps) => {
    const { sm } = useScreenSize();
    const [loading, setLoading] = useState(true);

    return (
        <Modal
            centered
            title={modalTitle}
            open={open}
            onCancel={handleCancel}
            closable
            destroyOnClose
            footer={null}
            width={sm ? '80%' : '100%'}
            styles={{ body: { padding: 0, height: sm ? '90vh' : '50vh' } }}
            style={{ top: 0 }}
            className="full-screen-modal"
        >
            <Flex className="h-full w-full relative pt-5">
                {loading && (
                    <Flex className="absolute inset-0  items-center justify-center bg-white">
                        {/* <Skeleton active /> */}
                        <Spin />
                    </Flex>
                )}
                <iframe
                    title={modalTitle}
                    src={videoUrl}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={`w-full h-full ${loading ? 'hidden' : 'block'}`}
                    onLoad={() => setLoading(false)}
                />
            </Flex>
        </Modal>
    );
};

export default IFrameModal;
