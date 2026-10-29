import React from 'react';

import { Flex, Modal } from 'antd';

type Props = {
    customComponents: React.ReactNode;
    isModalOpen: any;
    handleCancel: any;
    title?: string;
};

const AncCustomModal = ({ customComponents, isModalOpen, handleCancel, title }: Props) => (
    // const selectedAncillaries = useAppSelector(
    //     state => state.reducer.airline.selectedAncillaries.selectedAncillaries
    // );

    // const totalPrice = selectedAncillaries
    //     .filter(anc => anc.ancType === ancType && anc.passengerKey === passengerKey) // Filter for meals
    //     .reduce((total, anc) => total + anc.itemPrice, 0); // Sum the prices

    // console.log('here', totalPrice);

    <Modal
        title={title || 'Basic Modal'}
        open={isModalOpen}
        onCancel={handleCancel}
        width={1000}
        footer={null}
    >
        <Flex vertical className="mb-8 mt-6">
            {customComponents}
        </Flex>
    </Modal>
);

export default AncCustomModal;
