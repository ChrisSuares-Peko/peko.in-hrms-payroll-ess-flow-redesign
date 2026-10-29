import React, { useState } from 'react';

import { Button, Flex, Modal, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import ChangeVehicleDetailsModal from './ChangeVehicleDetailsModal';

interface EnterAgeModalProps {
    vehicleName: string;
    VehicleSvg: string;
    open: boolean;
    handleCancel: () => void;
}

const VehicleDetailsModal = ({
    vehicleName,
    VehicleSvg,
    open,
    handleCancel,
}: EnterAgeModalProps) => {
    const [openChangeVehicleDetailsModal, setOpenChangeVehicleDetailsModal] = useState(false);
    const navigate = useNavigate();
    const handleSubmit = async () => {
        handleCancel();
        navigate('list');
    };
    const handleEdit = () => {
        handleCancel();
        setOpenChangeVehicleDetailsModal(true);
    };
    return (
        <>
            <Modal
                open={open}
                onCancel={handleCancel}
                centered
                footer={[
                    <Flex align="center" gap={10} justify="center" className="mt-10" key="buttons">
                        <Button
                            key="edit"
                            danger
                            type="default"
                            className="rounded-sm px-10"
                            onClick={handleEdit}
                        >
                            Edit
                        </Button>
                        <Button
                            key="submit"
                            danger
                            type="primary"
                            className=" rounded-sm px-10"
                            onClick={handleSubmit}
                        >
                            Continue
                        </Button>
                    </Flex>,
                ]}
            >
                <Flex vertical align="center" gap={10}>
                    <ReactSVG src={VehicleSvg} />
                    <Typography.Text className="text-base font-semibold">
                        KL-34-G-9472
                    </Typography.Text>
                    <Typography.Text className="font-bold text-xl">
                        Toyota Innova 2.5 G 8 Seater (2494) cc
                    </Typography.Text>
                    <Typography.Text className="text-base font-semibold">
                        Registration in 2014
                    </Typography.Text>
                </Flex>
            </Modal>
            <ChangeVehicleDetailsModal
                open={openChangeVehicleDetailsModal}
                handleCancel={() => {
                    setOpenChangeVehicleDetailsModal(false);
                    handleCancel();
                }}
                vehicleName={vehicleName}
            />
        </>
    );
};

export default VehicleDetailsModal;
