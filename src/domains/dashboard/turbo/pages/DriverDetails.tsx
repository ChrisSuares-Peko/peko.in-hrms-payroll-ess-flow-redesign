import React, { useState } from 'react';

import { Button, Card, Flex, Typography } from 'antd';
import Skeleton from 'react-loading-skeleton';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import DriverCard from '../components/driverProfile/DriverCard';
import useDeleteDriverApi from '../hooks/useDeleteDriverApi';
import useGetDriverApi from '../hooks/useGetDriverApi';
import { resetRcResponse } from '../slices/turboSlice';

const DriverDetails = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { details, loading, setRefresh } = useGetDriverApi({ id: location.state.key });
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const { deleteApi } = useDeleteDriverApi();
    const handleDelete = () => {
        deleteApi({ id: location.state.key }).then((res: any) => {
            if (res) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Driver deleted successfully',
                        variant: 'success',
                    })
                );
                dispatch(resetRcResponse());
                navigate(`${paths.dashboard.turbo}/${paths.turbo.addDriver}`);
            }
            setOpenConfirmationModal(false);
        });
    };

    return (
        <>
            {loading ? (
                <Skeleton />
            ) : (
                <Card className="!shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                    <Flex justify="space-between"
                        className="flex-col w-full gap-3 sm:flex-row sm:items-center">
                        <Typography.Text className="text-xl font-medium">
                            {details?.dlNumber}
                        </Typography.Text>
                        <Button
                            className="px-6 w-fit"
                            type="default"
                            onClick={() => setOpenConfirmationModal(true)}
                            danger
                        >
                            Delete Profile
                        </Button>
                    </Flex>

                    <DriverCard
                        verifyResponse={details}
                        id={location.state.key}
                        setRefresh={setRefresh}
                    />
                    {openConfirmationModal && (
                        <ConfirmationModal
                            isOpen={openConfirmationModal}
                            handleCancel={() => setOpenConfirmationModal(false)}
                            title="Are you sure you want to delete this driver? This action will permanently remove the driver and its associated data (e.g., documents, vehicle assignment) from your fleet."
                            handleSubmit={handleDelete}
                            isLoading={false}
                        />
                    )}
                </Card>
            )}
        </>
    );
};

export default DriverDetails;
