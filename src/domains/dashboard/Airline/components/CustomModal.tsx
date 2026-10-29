import React from 'react';

import { Modal } from 'antd';

type Props = {
    customComponents: React.ReactNode;
    isModalOpen: any;
    handleOk: any;
    handleCancel: any;
};

const CustomModal = ({ customComponents, isModalOpen, handleOk, handleCancel }: Props) => (
    <Modal
        title="Basic Modal"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={1000}
    >
        {customComponents}
    </Modal>
);

export default CustomModal;
