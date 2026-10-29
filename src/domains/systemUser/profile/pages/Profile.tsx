import React, { useState } from 'react';

import { Button, Descriptions, Flex, Skeleton, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import EditPassword from '../components/EditPassword';
import EditProfileModal from '../components/EditProfileModal';
import useGetData from '../hooks/useGetData';

const Profile = () => {
    const { isLoading, profileData, setRefresh } = useGetData();
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [openEditPass, setOpenEditPass] = useState<boolean>(false);

    const handleEditBtn = () => {
        setOpenEditModal(true);
    };

    const handlePassBtn = () => {
        setOpenEditPass(true);
    };

    const handleEditClose = () => {
        setOpenEditModal(false);
    };
    const handlePassClose = () => {
        setOpenEditPass(false);
    };

    return isLoading ? (
        <>
            <Skeleton active paragraph={{ rows: 10 }} className="mt-10" />
            <Flex gap={20} justify="end" align="center" className="mt-10">
                <Skeleton.Button active style={{ width: '5rem' }} />
                <Skeleton.Button active style={{ width: '5rem' }} />
            </Flex>
        </>
    ) : (
        <>
            <Typography.Text className="text-xl font-medium ">Profile Information</Typography.Text>
            <Descriptions column={1} layout="horizontal" bordered className="mt-10">
                <Descriptions.Item labelStyle={{ fontWeight: 'bold' }} label="Username">
                    {profileData?.['credential.username']}
                </Descriptions.Item>
                <Descriptions.Item labelStyle={{ fontWeight: 'bold' }} label="Name">
                    {profileData?.['credential.name']}
                </Descriptions.Item>
                <Descriptions.Item labelStyle={{ fontWeight: 'bold' }} label="Registered By">
                    {profileData?.registeredBy || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Cashback" labelStyle={{ fontWeight: 'bold' }}>
                    ₹ {formatNumberWithLocalString(Number(profileData?.balance))}
                </Descriptions.Item>
                <Descriptions.Item label="Email" labelStyle={{ fontWeight: 'bold' }}>
                    {profileData?.email}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile No" labelStyle={{ fontWeight: 'bold' }}>
                    {profileData?.mobileNo || 'N/A'}
                </Descriptions.Item>
            </Descriptions>
            <Flex gap={20} justify="end" align="center" className="mt-10">
                <Button danger type="primary" className="px-5" onClick={handlePassBtn}>
                    Change Password
                </Button>
                <Button danger type="primary" className="px-5" onClick={handleEditBtn}>
                    Edit Profile
                </Button>
            </Flex>
            {openEditPass && (
                <EditPassword
                    setRefresh={setRefresh}
                    handleCancel={handlePassClose}
                    open={openEditPass}
                />
            )}
            {openEditModal && (
                <EditProfileModal
                    setRefresh={setRefresh}
                    handleCancel={handleEditClose}
                    open={openEditModal}
                    data={profileData}
                />
            )}
        </>
    );
};

export default Profile;
