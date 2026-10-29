import { Suspense, lazy, useState } from 'react';

import { Flex, Typography, Button, Skeleton, Image } from 'antd';

import EmptyImage from '@assets/svg/emptyDocs.svg';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import FieldLabelWithButton from './FieldLabelValueWithButton';
import { getAddressOtp } from '../api/address';
import useAddressesApi from '../hooks/useAddressesApi';
import { setData } from '../slices/address';

const AddressModal = lazy(() => import('./AddressModal'));
const ConfirmationModal = lazy(() => import('@components/molecular/modals/ConfirmationModal'));
const OtpModal = lazy(() => import('@components/molecular/modals/OtpModal'));

const AddressList = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const { id } = useAppSelector(state => state.reducer.address);
    const [openAddressInfoModal, setOpenAddressInfoModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { tableData, isLoading, handleDeleteAddress, isDeleteLoading } = useAddressesApi({
        handleCancel: () => setIsOpen(false),
    });

    return (
        <>
            <Flex vertical className=" mt-5 ">
                <Flex className="mt-1 w-full" justify="space-between" align="center">
                    <Typography.Title level={5}>Addresses</Typography.Title>
                    <Button
                        danger
                        size="small"
                        onClick={() => {
                            if (tableData && tableData.length >= 3) {
                                dispatch(
                                    showToast({
                                        description:
                                            'Oops! You’ve reached the maximum limit for adding addresses. Please remove an existing address before adding a new one.',
                                        variant: 'warning',
                                    })
                                );
                            } else {
                                dispatch(setData({ id: 0 }));
                                setOpenAddressInfoModal(true);
                            }
                        }}
                    >
                        Add Address
                    </Button>
                </Flex>
                <Flex
                    vertical
                    className=" mt-8 min-h-32 max-h-[26rem] sm:min-h-46 sm:max-h-56 overflow-y-scroll"
                    gap={20}
                >
                    {isLoading ? (
                        <Flex className=" w-full">
                            <Skeleton active avatar />
                        </Flex>
                    ) : (
                        <Flex vertical className="h-full  max-h-28 overflow-y-scroll">
                            {tableData?.length < 1 ? (
                                <Flex vertical align="center" justify="center" className="mt-1">
                                    <Image src={EmptyImage} preview={false} />
                                    <Typography.Text className="text-base font-normal  text-center text-gray-400 ">
                                        No saved addresses
                                    </Typography.Text>
                                </Flex>
                            ) : (
                                tableData?.map(
                                    ({
                                        id: itemId,
                                        addressType,
                                        addressLine1,
                                        addressLine2,
                                        default: defaultAddress,
                                    }) => (
                                        <FieldLabelWithButton
                                            key={itemId}
                                            label={`${addressType ?? '--'} ${defaultAddress === 1 ? '(Default)' : ''}`}
                                            value={`${addressLine1 ?? '--'}  ${addressLine2 ?? '--'}`}
                                            id={itemId}
                                            handleEdit={val => {
                                                dispatch(setData({ id: val }));
                                                setOpenAddressInfoModal(true);
                                            }}
                                            handleDelete={async val => {
                                                dispatch(setData({ id: val }));
                                                setOpenConfirmationModal(true);
                                            }}
                                        />
                                    )
                                )
                            )}
                        </Flex>
                    )}
                </Flex>
            </Flex>
            <Suspense>
                {openAddressInfoModal && (
                    <AddressModal
                        open={openAddressInfoModal}
                        handleCancel={() => setOpenAddressInfoModal(false)}
                    />
                )}
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this address?"
                    handleSubmit={async () => {
                        const resp = await getAddressOtp({
                            userId,
                            userType: role,
                            scope: Scope.EMAIL,
                            method: 'delete',
                            selectedId: id,
                        });
                        setOpenConfirmationModal(false);
                        if (resp) {
                            setIsOpen(true);
                        }
                    }}
                    isLoading={isDeleteLoading!}
                />
                <OtpModal
                    isOpen={isOpen}
                    isLoading={isDeleteLoading!}
                    handleCancel={() => setIsOpen(false)}
                    isOtpSending={isOtpSending}
                    onResend={async () => {
                        setIsOtpSending(true);
                        await getAddressOtp({
                            userId,
                            userType: role,
                            scope: Scope.EMAIL,
                            method: 'delete',
                            selectedId: id,
                        });
                        setIsOtpSending(false);
                    }}
                    handleSubmit={async otp => {
                        await handleDeleteAddress(id!, otp, Scope.EMAIL);
                    }}
                    title="Confirmation"
                />
            </Suspense>
        </>
    );
};

export default AddressList;
