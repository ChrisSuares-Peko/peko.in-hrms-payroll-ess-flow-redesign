import React, { useState } from 'react';

import { DeleteOutlined, EditOutlined, ExportOutlined } from '@ant-design/icons';
import { Col, Flex, Typography, Button, Image, Avatar } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import OwnerAvatar from '@domains/dashboard/PekoCloud/assets/images/Owner-Default.png';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useDeleteOwnerDocApi } from '../../hooks/ownerDocHooks/useDeleteOwnerDocApi';
import { getInitials } from '../../utils/helperFunctions';

interface InfoCardProps {
    owner: any;
    setOpenOwnerDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}
const PersonalInfoCard = ({ owner, setOpenOwnerDetailsModal, reloadTable }: InfoCardProps) => {
    const dispatch = useAppDispatch();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const displayMessage = () => {
        dispatch(showToast({ variant: 'info', description: 'Coming soon' }));
    };
    const { deleteOwnerDocData, isLoading: deleteLoader } = useDeleteOwnerDocApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const handleDelete = (selectedRow: any) => {
        setSelectedRecordData(selectedRow);
        setOpenConfirmationModal(true);
    };
    const handleDeleteOwner = async () => {
        await deleteOwnerDocData(selectedRecordData?.id!);
        setSelectedRecordData(null);
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <>
            <Col
                span={24}
                md={24}
                xl={6}
                className="p-8  xl:border-r md:border-b xl:border-b-0 flex flex-col justify-center"
            >
                <Flex className="  rounded-full py-2 " align="center">
                    {owner?.profilePicture ? (
                        <Image
                            width={52}
                            height={52}
                            preview={false}
                            src={owner.profilePicture || OwnerAvatar}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <Avatar
                            style={{
                                backgroundColor: '#fde3cf',
                                color: 'red',
                                width: 52,
                                height: 52,
                                fontSize: 20,
                            }}
                        >
                            {getInitials(owner?.ownerName)}
                        </Avatar>
                    )}
                </Flex>
                <Flex align="center" wrap="wrap">
                    <Typography.Text className="text-[1.3rem] font-semibold md:text-nowrap">
                        {owner.ownerName}
                    </Typography.Text>
                    <Button
                        className="border-0 ml-3"
                        size="small"
                        type="link"
                        onClick={() => setOpenOwnerDetailsModal(true)}
                    >
                        <EditOutlined className="text-[#E30000]" />
                    </Button>
                    <Button
                        className="border-0"
                        size="small"
                        type="link"
                        onClick={() => handleDelete(owner)}
                    >
                        <DeleteOutlined className="text-[#E30000]" />
                    </Button>
                </Flex>
                <Flex vertical gap={5}>
                    <Typography.Text className="">
                        {Number(owner.percentageOfShare).toFixed(2)}% ownership
                    </Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">
                        Home Address
                    </Typography.Text>
                    <Typography.Text className="">{owner.homeAddress}</Typography.Text>
                    <Typography.Text className="text-xs text-gray-400">Nationality</Typography.Text>
                    <Typography.Text className="">{owner.nationality}</Typography.Text>
                </Flex>
                <Flex>
                    <Button
                        type="link"
                        onClick={displayMessage}
                        danger
                        className="font-medium p-0"
                        icon={<ExportOutlined />}
                    >
                        Share Documents
                    </Button>
                </Flex>
            </Col>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this owner?"
                handleSubmit={handleDeleteOwner}
                isLoading={deleteLoader}
            />
        </>
    );
};

export default PersonalInfoCard;
