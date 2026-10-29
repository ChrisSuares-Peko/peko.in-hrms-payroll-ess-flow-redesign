import React from 'react';

import { Card, Flex, Modal, Typography } from 'antd';

interface hotelProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    roomData: string[];
}

const CheckInRoomDetails = ({ roomData, isModalOpen, handleCancel }: hotelProps) => (
    <Modal
        title="Room Details"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
    >
        <Card
            className="h-full sm:border-none md:border md:border-solid rounded-2xl"
            style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
            <Flex vertical gap={15}>
                {
                    roomData&&(
                           <ol style={{ lineHeight: '1.5', paddingLeft: '20px' }}>
                    {roomData.map((item, index) => (
                        <li key={index} style={{ marginBottom: '10px' }}>
                            <Typography.Text>{item}</Typography.Text>
                        </li>
                    ))}
                </ol>

                    )

                }
             
            </Flex>
        </Card>
    </Modal>
)

export default CheckInRoomDetails;
