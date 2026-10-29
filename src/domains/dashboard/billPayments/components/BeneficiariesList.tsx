/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';

import { Flex, Typography, Button, Skeleton, Carousel, Empty, Grid } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import BeneficiaryCard from './BeneficiaryCard';
import BeneficiaryModal from './BeneficiaryModal';
import { setData, setFormInitialValues } from '../slices/beneficiary';
import { BeneficiariesListProps, Beneficiary, BeneficiaryActionType } from '../types/index';

const { Text } = Typography;

const BeneficiariesList = ({ accessKeyName }: BeneficiariesListProps) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dispatch = useAppDispatch();

    useEffect(
        () => () => {
            dispatch(setData({ beneficiaryData: [], isLoading: true }));
        },
        [dispatch]
    );

    const { beneficiaryData, isLoading } = useAppSelector(state => state.reducer.beneficiary);

    const [beneficiaryActionType, setBeneficiaryActionType] = useState<BeneficiaryActionType>(
        BeneficiaryActionType.ADD
    );
    const [editBeneficiaryData, setEditBeneficiaryData] = useState<Beneficiary | null>(null);

    const handleEditClick = (beneficiary: Beneficiary) => {
        setEditBeneficiaryData(beneficiary);
        setBeneficiaryActionType(BeneficiaryActionType.EDIT);
        setIsModalOpen(true);
        dispatch(
            setFormInitialValues({
                accessKey: beneficiary.accessKey,
                name: beneficiary.name,
                billerId: beneficiary.billerId || '',
                serviceProvider: beneficiary.serviceProvider || '',
            })
        );
    };
    const handleAddBeneficiary = () => {
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
    };

    return (
        <>
            <Flex className="w-full h-9 " justify="space-between" align="center">
                <Text className="text-lg font-medium sm:text-lg">Your Beneficiaries</Text>
                <Button
                    danger
                    onClick={handleAddBeneficiary}
                    className="h-full text-xs sm:text-sm sm:px-5"
                >
                    Add Beneficiary
                </Button>
            </Flex>
            <Flex vertical className="mt-7 w-full sm:h-[42rem] sm:overflow-x-auto " gap={24}>
                {isLoading ? (
                    [...Array(5)].map((_, index) => <Skeleton key={index} active />)
                ) : beneficiaryData && beneficiaryData.length > 0 ? (
                    screens.xs ? (
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
                closeAddModal={() => setIsModalOpen(false)}
                editValues={editBeneficiaryData}
                beneficiaryActionType={beneficiaryActionType}
                setBeneficiaryActionType={setBeneficiaryActionType}
                accessKeyName={accessKeyName}
            />
        </>
    );
};

export default BeneficiariesList;
