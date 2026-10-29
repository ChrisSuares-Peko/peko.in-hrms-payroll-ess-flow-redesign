import { useState } from 'react';

import { CloseOutlined, WarningFilled } from '@ant-design/icons';
import { Button, Flex, Modal, Spin, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addBeneficiaries } from '../../api/employeeSalaryApi/salaryRolloutApi';
import { useListPendingBeneficiaryEmployees } from '../../hooks/employeeSalaryHooks/salaryRolloutHooks/useListPendingBeneficiaryEmployees';

const { Text } = Typography;

const bankStatusColor = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (s === 'completed' || s === 'approved') return '#12B76A';
    if (s === 'failed' || s === 'missing information') return '#F04438';
    return '#F59E0B';
};

const beneficiaryStatusColor = (status: string) => {
    const s = status?.toLowerCase().trim();
    if (s === 'added') return '#12B76A';
    if (s === 'failed') return '#F04438';
    return '#F59E0B';
};

interface AddBeneficiaryModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

interface FailedResult {
    employeeId: string;
    message: string;
    bankAccountStatus?: string;
    beneficiaryStatus?: string;
}

const AddBeneficiaryModal = ({ open, onClose, onConfirm }: AddBeneficiaryModalProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { rows, isLoading } = useListPendingBeneficiaryEmployees(open);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [failedResults, setFailedResults] = useState<FailedResult[]>([]);
    const [resultStats, setResultStats] = useState<{ accountsVerified: number; beneficiariesAdded: number } | null>(null);
    const [hasSucceeded, setHasSucceeded] = useState(false);

    const handleClose = () => {
        setFailedResults([]);
        setResultStats(null);
        if (hasSucceeded) {
            setHasSucceeded(false);
            onConfirm();
        } else {
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (rows.length === 0) return;
        setIsSubmitting(true);
        const employeeIds = rows.map(emp => emp.key);
        const result = await addBeneficiaries({ userId: String(id), userType: role, employeeIds });
        setIsSubmitting(false);

        const allResults: any[] = result?.data?.results ?? [];
        const failed: FailedResult[] = allResults.filter((r: any) => !r.success);
        const succeeded = result?.data?.summary?.succeeded ?? 0;

        const accountsVerified = allResults.filter((r: any) =>
            r.bankAccountStatus?.toLowerCase() === 'completed'
        ).length;
        const beneficiariesAdded = allResults.filter((r: any) =>
            r.beneficiaryStatus?.toLowerCase() === 'added'
        ).length;

        if (failed.length > 0) {
            setFailedResults(failed);

            setResultStats({ accountsVerified, beneficiariesAdded });
            if (succeeded > 0) setHasSucceeded(true);
        } else if (result?.status) {
            dispatch(showToast({ variant: 'success', description: result.message ?? 'Beneficiaries added successfully' }));
            onConfirm();
        } else {
            dispatch(showToast({ variant: 'error', description: result?.message ?? 'Failed to add beneficiaries. Please try again.' }));
        }
    };

    const renderErrors = () => (
        <Flex vertical gap={12}>
            <Flex
                vertical
                style={{
                    background: '#FFF9F9',
                    border: '1px solid #FECDCA',
                    borderRadius: 16,
                    padding: '16px 20px',
                }}
            >
                {failedResults.map((item, index) => {
                    const emp = rows.find(r => r.key === item.employeeId);
                    return (
                        <Flex
                            key={item.employeeId}
                            align="flex-start"
                            gap={12}
                            style={{
                                paddingBottom: index < failedResults.length - 1 ? 14 : 0,
                                marginBottom: index < failedResults.length - 1 ? 14 : 0,
                                borderBottom: index < failedResults.length - 1 ? '1px solid #FECDCA' : 'none',
                            }}
                        >
                            <WarningFilled style={{ fontSize: 16, color: '#F04438', marginTop: 2, flexShrink: 0 }} />
                            <Flex vertical gap={4}>
                                <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828', lineHeight: '20px' }}>
                                    {emp?.name ?? item.employeeId}
                                </Text>
                                <Text style={{ fontSize: 11, fontWeight: 600, color: '#F04438', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    {item.bankAccountStatus?.toLowerCase() === 'completed' ? 'Beneficiary Error' : 'Bank Verification Error'}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#F04438', lineHeight: '20px' }}>
                                    {item.message}
                                </Text>
                            </Flex>
                        </Flex>
                    );
                })}
            </Flex>
        </Flex>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <Flex justify="center" align="center" style={{ minHeight: 120 }}>
                    <Spin />
                </Flex>
            );
        }
        if (rows.length === 0) {
            return (
                <Flex justify="center" align="center" style={{ minHeight: 80 }}>
                    <Text style={{ fontSize: 14, color: '#6B788E' }}>No data available</Text>
                </Flex>
            );
        }
        return (
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    boxShadow: '0px 1px 12px 1px rgba(122,122,122,0.06)',
                    borderRadius: 16,
                    padding: '16px 20px',
                }}
            >
                {rows.map((emp, index) => {
                    const bankColor = bankStatusColor(emp.bankAccountStatus);
                    const beneficiaryColor = beneficiaryStatusColor(emp.beneficiaryStatus);
                    return (
                        <Flex
                            key={emp.key}
                            align="center"
                            gap={12}
                            style={{
                                paddingBottom: index < rows.length - 1 ? 14 : 0,
                                marginBottom: index < rows.length - 1 ? 14 : 0,
                                borderBottom: index < rows.length - 1 ? '1px solid #EAECF0' : 'none',
                            }}
                        >
                            {emp.profileImage ? (
                                <img
                                    src={emp.profileImage}
                                    alt={emp.initials}
                                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                />
                            ) : (
                                <Flex
                                    align="center"
                                    justify="center"
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: emp.avatarBg,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#FF9F9F' }}>
                                        {emp.initials}
                                    </Text>
                                </Flex>
                            )}
                            <Flex vertical gap={4} style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828', lineHeight: '20px' }}>
                                    {emp.name}
                                </Text>
                                <Flex gap={12}>
                                    <Text style={{ fontSize: 12, color: '#8993A4' }}>
                                        Bank: <span style={{ color: bankColor, fontWeight: 500 }}>{emp.bankAccountStatus}</span>
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#8993A4' }}>
                                        Beneficiary: <span style={{ color: beneficiaryColor, fontWeight: 500 }}>{emp.beneficiaryStatus}</span>
                                    </Text>
                                </Flex>
                            </Flex>
                        </Flex>
                    );
                })}
            </Flex>
        );
    };

    const showErrors = failedResults.length > 0;

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closable={false}
            centered
            width={440}
            styles={{
                content: {
                    borderRadius: 24,
                    padding: '24px 28px',
                },
            }}
        >
            <Flex vertical gap={20}>
                <Flex justify="space-between" align="flex-start">
                    <Flex vertical gap={6} style={{ flex: 1, paddingRight: 12 }}>
                        <Text style={{ fontSize: 18, fontWeight: 500, color: '#000000', lineHeight: '26px' }}>
                            Verify Bank Account & Add Beneficiary
                        </Text>
                        <Text style={{ fontSize: 13, color: '#6B788E', lineHeight: '20px' }}>
                            Employees who are yet to be added as a beneficiary are shown here, including those with completed and pending bank account verification.
                        </Text>
                    </Flex>
                    <Button
                        type="text"
                        icon={<CloseOutlined style={{ fontSize: 14, color: '#6B788E' }} />}
                        onClick={handleClose}
                        style={{ padding: 4, height: 'auto', flexShrink: 0 }}
                    />
                </Flex>

                {showErrors ? renderErrors() : renderContent()}

                {showErrors && resultStats && (
                    <Text style={{ fontSize: 13, color: '#6B788E', textAlign: 'center' }}>
                        {resultStats.accountsVerified} account{resultStats.accountsVerified !== 1 ? 's' : ''} verified, {resultStats.beneficiariesAdded} {resultStats.beneficiariesAdded !== 1 ? 'beneficiaries' : 'beneficiary'} added
                    </Text>
                )}

                <Button
                    type="primary"
                    danger
                    block
                    disabled={!showErrors && rows.length === 0}
                    loading={isSubmitting}
                    onClick={showErrors ? handleClose : handleConfirm}
                >
                    {showErrors ? 'Close' : 'Verify and add Beneficiary'}
                </Button>
            </Flex>
        </Modal>
    );
};

export default AddBeneficiaryModal;
