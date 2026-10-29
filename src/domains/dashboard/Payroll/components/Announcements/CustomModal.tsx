import React from 'react';

import { Button, Divider, Flex, List, Modal, Typography } from 'antd';

import ModalDetails from './ModalDetails';
import { IModalData } from '../../types/announcementTypes';

type Props = {
    toggleModal: () => void;
    isModalOpen: boolean;
    modalData: IModalData;
};
const CustomModal = ({ toggleModal, isModalOpen, modalData }: Props) => (
    <Modal
        width={772}
        title="Announcement"
        open={isModalOpen}
        onOk={toggleModal}
        onCancel={toggleModal}
        footer={[
            <Flex className="w-full" justify="flex-end" gap={10} key="">
                <Button
                    key="submit"
                    type="primary"
                    danger
                    onClick={() => {
                        toggleModal();
                    }}
                    className=" rounded-sm"
                >
                    Close
                </Button>
            </Flex>,
        ]}
    >
        <Flex justify="space-between" className="mt-6">
            <Flex>
                <ModalDetails text={modalData && modalData.date} title="Date: " />
            </Flex>
            <Flex>
                <ModalDetails text={modalData && modalData.status} title="Status: " />
            </Flex>
        </Flex>
        <Flex justify="space-between" className="mt-4">
            <Flex>
                <ModalDetails text={modalData && modalData.subject} title="Subject: " />
            </Flex>
        </Flex>
        <Flex justify="space-between" className="mt-6">
            <Flex>
                <Typography.Text className="text-base font-medium"> Details: </Typography.Text>
            </Flex>
        </Flex>
        <Flex>
            <Typography.Text className="text-base">
                {modalData && ` ${modalData.details}`}
            </Typography.Text>
        </Flex>
        <Divider className="my-4" />
        <Flex vertical gap={10}>
            <Typography.Text className="text-base font-medium">
                Excluded Employees:
            </Typography.Text>
            {modalData?.excludedEmployees?.length ? (
                <List
                    bordered
                    size="small"
                    dataSource={modalData.excludedEmployees}
                    renderItem={employee => (
                        <List.Item>
                            <Flex vertical>
                                <Typography.Text className="text-base">
                                    {employee.personalInformation?.fullName || 'N/A'}
                                </Typography.Text>
                                <Typography.Text type="secondary" className="text-sm">
                                    {employee.personalInformation?.email || 'N/A'}
                                </Typography.Text>
                            </Flex>
                        </List.Item>
                    )}
                />
            ) : (
                <Typography.Text className="text-base text-slate-500">
                    No excluded employees
                </Typography.Text>
            )}
        </Flex>
    </Modal>
);

export default CustomModal;
