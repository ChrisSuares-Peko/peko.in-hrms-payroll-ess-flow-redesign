import React, { useState } from 'react';

import { Card, Row, Col, Typography, Button, Empty, Skeleton, Flex, Space } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BankDetailsModal from './modals/BankDetailsModal';
import { useEployeeBankApi } from '../../hooks/employeeProfileHooks/useEmployeeBankApi';
import { useGetEmployeeBankDetailsApi } from '../../hooks/employeeProfileHooks/useGetEmployeeBankDetailsApi';
import { EmployeeProfile } from '../../types/employeeprofile/type';

const { Title, Text, Link } = Typography;

type Props = {
    employeeData: EmployeeProfile | false | undefined;
    handleCancel?: () => void;
};

const BankDetails = ({ employeeData, handleCancel }: Props) => {
    const dispatch = useAppDispatch();
    const [openBankModal, setOpenBankModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

    const employeeId =
        employeeData && typeof employeeData !== 'boolean' ? employeeData.id : undefined;

    const { data = [], tableLoading } = useGetEmployeeBankDetailsApi(employeeId || '', reloadTable);
    const { deleteBankDetailsAction, isLoading } = useEployeeBankApi(handleCancel);

    const handleDeleteBankDetails = async () => {
        await deleteBankDetailsAction(selectedRecordData?.id!);
        setOpenConfirmationModal(false);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    let content;

    if (tableLoading) {
        content = (
            <Col span={24}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </Col>
        );
    } else if (data.length === 0) {
        content = (
            <Col span={24}>
                <Empty description="No Bank Accounts Found" />
            </Col>
        );
    } else {
        content = data.map(bank => (
            <Col
                key={bank.id}
                md={12}
                xs={24}
                style={{ padding: '0 12px' }}
                className="justify-center"
            >
                <Card
                    bordered
                    style={{
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        backgroundColor: '#f9f9f9',
                    }}
                    className="xs:justify-center"
                >
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Title level={5} style={{ margin: 0 }}>
                                {bank.bankName}{' '}
                                {bank.isDefaultAccount && (
                                    <Text type="secondary" style={{ fontWeight: 'normal' }}>
                                        (Default)
                                    </Text>
                                )}
                            </Title>
                        </Col>
                        <Col>
                            <Space>
                                <Link
                                    style={{ color: '#FF3A3A', textDecoration: 'none' }}
                                    onClick={() => {
                                        setSelectedRecordData(bank);
                                        setOpenBankModal(true);
                                    }}
                                >
                                    Edit
                                </Link>

                                <Link
                                    style={{ color: '#FF3A3A', textDecoration: 'none' }}
                                    onClick={() => {
                                        setSelectedRecordData(bank);
                                        setOpenConfirmationModal(true);
                                    }}
                                >
                                    Delete
                                </Link>
                            </Space>
                        </Col>
                    </Row>

                    <Row style={{ marginTop: 16 }}>
                        <Col span={12}>
                            <Text strong>{bank.accountName || 'N/A'}</Text>
                            <br />
                            <Text type="secondary">Account Holder Name</Text>
                        </Col>
                        <Col span={12}>
                            <Text strong>{bank.accountNumber}</Text>
                            <br />
                            <Text type="secondary">Account Number</Text>
                        </Col>
                    </Row>

                    <Row style={{ marginTop: 16 }}>
                        <Col span={12}>
                            <Text strong>{bank.bankName}</Text>
                            <br />
                            <Text type="secondary">Bank Name</Text>
                        </Col>
                        <Col span={12}>
                            <Text strong>{bank.ifscCode}</Text>
                            <br />
                            <Text type="secondary">IFSC Code</Text>
                        </Col>
                    </Row>
                </Card>
            </Col>
        ));
    }
    const handleAddBankAccount = () => {
        if (data.length >= 5) {
            dispatch(
                showToast({
                    description:
                        "Oops! You've reached the maximum limit for adding bank accounts. Remove one to add a new one.",
                    variant: 'error',
                })
            );
            return;
        }
        setOpenBankModal(true);
    };

    return (
        <Flex vertical className="">
            <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                <Col className="xs:justify-center">
                    <Title level={4}>Bank Accounts</Title>
                </Col>
                <Col>
                    <Button type="primary" ghost onClick={handleAddBankAccount}>
                        Add Bank Account
                    </Button>
                </Col>
            </Row>

            <Row gutter={[26, 26]}>
                {content} {/* Render the content based on loading or data availability */}
            </Row>

            {openBankModal && (
                <BankDetailsModal
                    employeeId={employeeId || ''}
                    open={openBankModal}
                    handleCancel={() => setOpenBankModal(false)}
                    selectedRecordData={selectedRecordData}
                    reloadTable={setReloadTable}
                />
            )}

            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this bank account ?"
                    handleSubmit={handleDeleteBankDetails}
                    isLoading={isLoading}
                />
            )}
        </Flex>
    );
};

export default BankDetails;
