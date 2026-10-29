/* eslint-disable no-nested-ternary */
import React, { lazy, useCallback, useState } from 'react';

import { Flex, Typography, Button, Skeleton, Carousel, Empty } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import BeneficiaryCard from './BeneficiaryCard';
import { setFormInitialValues } from '../../billPayments/slices/beneficiary';
import { BeneficiariesListProps, Beneficiary, BeneficiaryActionType } from '../types/index';

const BeneficiaryModal = lazy(() => import('./BeneficiaryModal'));

const { Text } = Typography;

const BeneficiariesList = ({ accessKeyName }: BeneficiariesListProps) => {
    const { xs } = useScreenSize();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editBeneficiaryData, setEditBeneficiaryData] = useState<Beneficiary | null>(null);
    const dispatch = useAppDispatch();

    const { beneficiaryData, isLoading } = useAppSelector(state => state.reducer.beneficiary);
    const [beneficiaryActionType, setBeneficiaryActionType] = useState<BeneficiaryActionType>(
        BeneficiaryActionType.ADD
    );

    const handleEditClick = useCallback(
        (beneficiary: Beneficiary) => {
            setEditBeneficiaryData(beneficiary);
            setBeneficiaryActionType(BeneficiaryActionType.EDIT);
            setIsModalOpen(true);
            dispatch(
                setFormInitialValues({
                    accessKey: beneficiary.accessKey,
                    name: beneficiary.name,
                    billerId: beneficiary.billerId || '',
                    phoneNo: beneficiary.phoneNo || '',
                    providerCircle: beneficiary.providerCircle || '',
                    serviceProvider: beneficiary.serviceProvider || '',
                })
            );
        },
        [dispatch, setEditBeneficiaryData, setBeneficiaryActionType, setIsModalOpen]
    );

    const handleAddBeneficiary = useCallback(() => {
        setEditBeneficiaryData(null);
        setBeneficiaryActionType(BeneficiaryActionType.ADD);
        setIsModalOpen(true);
        dispatch(
            setFormInitialValues({
                accessKey: '',
                name: '',
                billerId: '',
            })
        );
    }, [dispatch, setEditBeneficiaryData, setBeneficiaryActionType, setIsModalOpen]);

    return (
        <>
            <Flex className="w-full h-9 " justify="space-between" align="center">
                <Text className="text-lg font-medium sm:text-lg">Your Beneficiaries</Text>
                <Button
                    danger
                    onClick={handleAddBeneficiary}
                    className="h-full !rounded-lg text-xs sm:text-sm sm:px-5"
                >
                    Add Beneficiary
                </Button>
            </Flex>
            <Flex vertical className="mt-8 w-full sm:h-[42rem] sm:overflow-x-auto " gap={24}>
                {isLoading ? (
                    [...Array(5)].map((_, index) => <Skeleton key={index} active />)
                ) : beneficiaryData && beneficiaryData.length > 0 ? (
                    xs ? (
                        <Carousel
                            className="relative"
                            slidesToShow={1}
                            autoplay
                            dots={{ className: 'custom-slick-dots-bussiness' }}
                        >
                            {beneficiaryData.map((item, index) => (
                                <BeneficiaryCard
                                    key={index}
                                    beneficiary={item}
                                    handleEdit={() => handleEditClick(item)}
                                />
                            ))}
                        </Carousel>
                    ) : (
                        beneficiaryData.map((item, index) => (
                            <BeneficiaryCard
                                key={index}
                                beneficiary={item}
                                handleEdit={() => handleEditClick(item)}
                            />
                        ))
                    )
                ) : (
                    <Flex className="h-full" justify="center" align="center">
                        <Empty
                            description={
                                <Typography.Text className="px-0 sm:px-10 text-gray-400">
                                    No Beneficiaries Found.
                                </Typography.Text>
                            }
                        />
                    </Flex>
                )}
            </Flex>
            <BeneficiaryModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                closeAddModal={() => setIsModalOpen(false)}
                editValues={editBeneficiaryData}
                beneficiaryActionType={beneficiaryActionType}
                setBeneficiaryActionType={setBeneficiaryActionType}
                accessKeyName={accessKeyName}
            />
        </>
    );
};

export default React.memo(BeneficiariesList);
