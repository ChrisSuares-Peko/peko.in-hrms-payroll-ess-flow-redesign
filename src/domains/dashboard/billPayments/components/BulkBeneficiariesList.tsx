/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import { Flex, Typography, Button, Empty, Col, Table, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import BeneficiaryModal from './BeneficiaryModal';
import useBeneficiaryApis from '../hooks/useBeneficiaryApis';
import { setFormInitialValues } from '../slices/beneficiary';
import { BeneficiariesListProps, Beneficiary, BeneficiaryActionType } from '../types';
import { beneficiaryTableColumn } from '../utils/tableColumn';

const BulkBenificiariesList = ({ accessKeyName }: BeneficiariesListProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { beneficiaryData, isLoading } = useAppSelector(data => data.reducer.beneficiary);
    const { ADD } = BeneficiaryActionType;
    const [beneficiaryActionType, setBeneficiaryActionType] = useState<BeneficiaryActionType>(ADD);
    const [editBeneficiaryData, setEditBeneficiaryData] = useState<Beneficiary | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useBeneficiaryApis({
        accessKey: accessKeyName,
        beneficiaryActionType,
        setBeneficiaryActionType,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [openBulkModal, setOpenBulkModal] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState<Record<string, boolean>>({});

    const toggleDropdown = (key: string, visible: boolean) => {
        setDropdownVisible(prev => ({ ...prev, [key]: visible }));
    };

    // useEffect(() => {
    //     setBeneficiaryData(beneficiaryData);
    // }, [beneficiaryData]);

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[], selectedRows: any[]) => {
            const activeRowKeys = selectedRows
                .filter(row => row.isActive)
                .map(row => row.key) as React.Key[];
            setSelectedRowKeys(activeRowKeys);
        },
        getCheckboxProps: (record: any) => ({
            disabled: !record.isActive,
        }),
    };

    const handleAddBeneficiary = () => {
        setEditBeneficiaryData(null);
        setBeneficiaryActionType(ADD);
        setIsModalOpen(true);
    };
    const handleEditClick = (beneficiary: Beneficiary) => {
        setEditBeneficiaryData(beneficiary);
        setBeneficiaryActionType(BeneficiaryActionType.EDIT);
        setIsModalOpen(true);
        dispatch(
            setFormInitialValues({
                accessKey: beneficiary.accessKey,
                name: beneficiary.name,
                billerId: beneficiary.billerId || '',
            })
        );
    };

    return (
        <>
            <Col className="flex flex-col flex-wrap w-full gap-5 bg-red- sm:flex-row sm:justify-between">
                <Typography.Text className="text-base font-medium sm:text-lg">
                    Your Beneficiaries
                </Typography.Text>
                <Col className="flex gap-5">
                    <Button
                        danger
                        onClick={handleAddBeneficiary}
                        className="text-xs h-9 sm:text-sm"
                    >
                        Add Beneficiary
                    </Button>
                    <Button
                        danger
                        className="h-full text-xs sm:text-sm sm:px"
                        onClick={() => setOpenBulkModal(true)}
                    >
                        Bulk Upload
                    </Button>
                </Col>
            </Col>

            <Col className="mt-3 w-full h-[24rem] sm:pr-3 overflow-x-auto">
                {isLoading ? (
                    [...Array(5)].map((_, index) => <Skeleton key={index} active />)
                ) : beneficiaryData && beneficiaryData.length > 0 ? (
                    <Table
                        rowSelection={rowSelection}
                        columns={beneficiaryTableColumn(
                            dropdownVisible,
                            toggleDropdown,
                            handleEditClick
                        )}
                        dataSource={beneficiaryData.map(item => ({
                            ...item,
                            key: item.id,
                        }))}
                        pagination={false}
                    />
                ) : (
                    <Flex className="h-full" justify="center" align="center">
                        <Empty
                            description={
                                <Typography.Text className="px-0 text-gray-400 sm:px-10">
                                    No Beneficiaries Found.
                                </Typography.Text>
                            }
                        />{' '}
                    </Flex>
                )}
            </Col>
            <Flex className="w-full px-5">
                <Button
                    danger
                    type="primary"
                    size="large"
                    className="w-full mt-7"
                    onClick={() => navigate(paths.billPayments.bulkPayment)}
                    // loading={isbulkLoading}
                >
                    View Bills
                </Button>
            </Flex>
            {isModalOpen && (
                <BeneficiaryModal
                    open={isModalOpen}
                    // onCancel={() => setIsModalOpen(false)}
                    closeAddModal={() => setIsModalOpen(false)}
                    editValues={editBeneficiaryData}
                    beneficiaryActionType={beneficiaryActionType}
                    setBeneficiaryActionType={setBeneficiaryActionType}
                    accessKeyName={accessKeyName}
                />
            )}
            {/* {openBulkModal && (
                <BulkUploadModal
                    open={openBulkModal}
                    handleCancel={() => setOpenBulkModal(false)}
                    handleBulkUpload={BulkUpload}
                    isUploading={false}
                    handleTemplateDownload={getetiSalatBulkUploadTemplate}
                    isTemplateFileLoading={isTemplateFileLoading}
                />
            )} */}

            {/* 

            
            <OtpModal
                isOpen={showOtpModal}
                isLoading={buttonLoader!}
                handleCancel={() => setShowOtpModal(false)}
                onResend={() => sendOtpApi(beneficiaryActionType)}
                isOtpSending={isOtpSending}
                handleSubmit={async otp => {
                    const resp = await deleteBeneficicary({
                        userId: id,
                        userType: role,
                        id: editBeneficiaryData?.id,
                        scope: 'email',
                        otp,
                    });
                    if (resp) setBeneficiaryActionType(EDIT);
                    if (resp)
                        setBeneficiaryData(prevData =>
                            prevData.filter(item => item.id !== editBeneficiaryData?.id)
                        );
                    if (resp) {
                        setShowOtpModal(false);
                    }
                }}
                title="OTP Verification"
            />
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this beneficiary?"
                handleSubmit={async () => {
                    sendOtpApi(DELETE);
                    setBeneficiaryActionType(DELETE);
                }}
                isLoading={isOtpSending!}
            /> */}
        </>
    );
};

export default BulkBenificiariesList;
