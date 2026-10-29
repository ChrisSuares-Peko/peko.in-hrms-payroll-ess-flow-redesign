import { useState } from 'react';

import { Flex, Typography, Button, Skeleton, Image } from 'antd';

import EmptyImage from '@assets/svg/emptyDocs.svg';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BankModal from './BankModal';
import FieldLabelWithButton from './FieldLabelValueWithButton';
import { getBankOtp } from '../api/bank';
import useBankApi from '../hooks/useBankApi';
import { setData } from '../slices/bank';

const BankAccounts = () => {
    const dispatch = useAppDispatch();
    const { id: userId, role } = useAppSelector(state => state.reducer.auth);
    const [account, setAccount] = useState('');
    const { id } = useAppSelector(state => state.reducer.bank);
    const [openBankModal, setOpenBankModal] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [isConformationLoading, setIsConformationLoading] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const { tableData, isLoading, isDeleteLoading, handleDeleteBank } = useBankApi({
        handleCancel: () => setIsOpen(false),
    });
    return (
        <>
            <Flex
                vertical
                className="h-full sm:border border-solid border-gray-200 p-2 sm:p-6  rounded-xl"
            >
                <Flex className="w-full " justify="space-between" align="center">
                    <Typography.Title level={5}>Bank Accounts</Typography.Title>

                    <Button
                        danger
                        size="small"
                        onClick={() => {
                            if (tableData && tableData.length >= 5) {
                                dispatch(
                                    showToast({
                                        description:
                                            'Oops! You’ve reached the maximum limit for adding the bank accounts. Remove one to add a new one.',
                                        variant: 'warning',
                                    })
                                );
                            } else {
                                setOpenBankModal(true);
                                dispatch(setData({ id: 0 }));
                            }
                        }}
                    >
                        Add Account
                    </Button>
                </Flex>
                <Flex
                    vertical
                    className=" mt-8 min-h-72 max-h-[26rem]  sm:min-h-52 sm:max-h-52 overflow-y-scroll"
                    gap={20}
                >
                    {isLoading ? (
                        <Flex className="w-full ">
                            <Skeleton avatar />
                        </Flex>
                    ) : (
                        <>
                            {tableData?.length < 1 ? (
                                <Flex vertical align="center" justify="center" className="mt-8">
                                    <Image src={EmptyImage} preview={false} />
                                    <Typography.Text className="py-4 text-base font-normal text-center text-gray-400 ">
                                        No bank accounts saved
                                    </Typography.Text>
                                </Flex>
                            ) : (
                                tableData?.map(
                                    ({
                                        id: itemId,
                                        bankName,
                                        accountNumber,
                                        default: defaultBank,
                                    }) => (
                                        <FieldLabelWithButton
                                            key={itemId}
                                            label={accountNumber}
                                            value={`${bankName ?? '--'} ${defaultBank ? '(Default)' : ''}`}
                                            id={itemId}
                                            handleEdit={val => {
                                                dispatch(setData({ id: val }));
                                                setOpenBankModal(true);
                                            }}
                                            handleDelete={val => {
                                                dispatch(setData({ id: val }));
                                                setAccount(accountNumber);
                                                setOpenConfirmationModal(true);
                                            }}
                                        />
                                    )
                                )
                            )}
                        </>
                    )}
                </Flex>
            </Flex>
            <BankModal open={openBankModal} handleCancel={() => setOpenBankModal(false)} />
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this bank account?"
                handleSubmit={async () => {
                    setIsConformationLoading(true);
                    const resp = await getBankOtp({
                        userId,
                        userType: role,
                        scope: Scope.EMAIL,
                        method: 'delete',
                        selectedId: id,
                        accountNumber: account,
                    });
                    setOpenConfirmationModal(false);
                    if (resp) {
                        setIsConformationLoading(false);
                        setIsOpen(true);
                    } else {
                        setIsConformationLoading(false);
                    }
                }}
                isLoading={isConformationLoading}
            />
            <OtpModal
                isOpen={isOpen}
                isLoading={isDeleteLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    await getBankOtp({
                        userId,
                        userType: role,
                        scope: Scope.EMAIL,
                        method: 'delete',
                        accountNumber: account,
                    });
                    setIsOtpSending(false);
                }}
                handleSubmit={async otp => {
                    await handleDeleteBank(id!, otp, Scope.EMAIL);
                }}
                title="Confirmation"
            />
        </>
    );
};

export default BankAccounts;
