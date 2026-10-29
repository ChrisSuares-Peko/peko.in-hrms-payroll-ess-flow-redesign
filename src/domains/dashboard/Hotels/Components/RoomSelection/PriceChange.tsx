import React from 'react';

import { Button, Flex, Modal, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

interface modalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    changedPrice?: number;
    actualPrice: number;
}

const PriceChange = ({ isModalOpen, handleCancel, changedPrice, actualPrice }: modalProps) => {
    const navigate = useNavigate();
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Modal title="" open={isModalOpen} footer={null} onCancel={handleCancel}>
            <Typography.Title level={3} className="font-bold text-center">
                Price Changed
            </Typography.Title>
            <Flex className="pt-5">
                <Typography.Paragraph className="">
                    The price of the hotel you selected has been modified. Please confirm if you
                    still wish to proceed with the booking at the updated price.
                </Typography.Paragraph>
            </Flex>
            <Flex justify="space-evenly" className=" pt-10">
                <Flex vertical>
                    <Typography.Text className="">Previous Price</Typography.Text>
                    <Typography.Title level={5}>₹ {actualPrice}</Typography.Title>
                </Flex>
                <Flex vertical>
                    <Typography.Text>New Price</Typography.Text>
                    <Typography.Title level={5}>₹ {changedPrice}</Typography.Title>
                </Flex>
            </Flex>
            <Flex gap={10} justify="end">
                <Button
                    size="middle"
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.corporateTravel}/${paths.hotels.index}/${paths.hotels.details}`
                        )
                    }
                    className="px-5  rounded-md mt-5"
                    danger
                >
                    Cancel
                </Button>
                <Button
                    size="middle"
                    onClick={() => navigate(paths.hotels.userDetails)}
                    className="px-5  rounded-md mt-5"
                    style={{ backgroundColor: colorPrimary, color: 'white' }}
                >
                    Continue
                </Button>
            </Flex>
        </Modal>
    );
};

export default PriceChange;
