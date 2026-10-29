import { useState } from 'react';

import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal, Spin, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyBankAccounts } from '../../api/employeeSalaryApi/salaryRolloutApi';
import { useListPendingVerificationEmployees } from '../../hooks/employeeSalaryHooks/salaryRolloutHooks/useListPendingVerificationEmployees';

const { Text } = Typography;

interface VerifyAccountModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const friendlyMessage: Record<string, string> = {
    failed_at_bank: 'Failed at bank. Please check account details.',
    verification_already_under_process: 'Verification already in progress.',
};

const getFriendlyMessage = (result: { message: string; data?: { response?: { code?: string } } }) => {
    const code = result.data?.response?.code;
    return (code && friendlyMessage[code]) ?? result.message;
};

type VerificationResult = {
    employeeId: string;
    success: boolean;
    message: string;
    data?: { response?: { code?: string } };
};

const VerifyAccountModal = ({ open, onClose, onConfirm }: VerifyAccountModalProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { rows, isLoading } = useListPendingVerificationEmployees(open);
    const [selected, setSelected] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMap, setResultMap] = useState<Record<string, VerificationResult>>({});
    const hasResults = Object.keys(resultMap).length > 0;

    const toggle = (key: string) =>
        setSelected(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    const handleConfirm = async () => {
        if (selected.length === 0) return;
        setIsSubmitting(true);
        setResultMap({});
        const result = await verifyBankAccounts({ userId: String(id), userType: role, employeeIds: selected });
        setIsSubmitting(false);

        const results: VerificationResult[] = result?.data?.results ?? [];
        const map: Record<string, VerificationResult> = {};
        results.forEach(r => { map[r.employeeId] = r; });
        setResultMap(map);

        const succeeded = result?.data?.summary?.succeeded ?? 0;
        const failed = result?.data?.summary?.failed ?? 0;

        if (result?.status || (succeeded > 0 && failed === 0)) {
            dispatch(showToast({ variant: 'success', description: result.message ?? 'Bank accounts verified successfully' }));
            setSelected([]);
            setResultMap({});
            onConfirm();
        } else if (succeeded > 0 && failed > 0) {
            dispatch(showToast({ variant: 'success', description: `${succeeded} verified, ${failed} failed. See details below.` }));
        } else {
            dispatch(showToast({ variant: 'error', description: result?.message ?? 'Verification failed. Please try again.' }));
        }
    };

    const handleClose = () => {
        setSelected([]);
        setResultMap({});
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            closable={false}
            centered
            width={500}
            styles={{
                content: {
                    borderRadius: 24,
                    padding: '24px 28px',
                },
            }}
        >
            <Flex vertical gap={20}>
                <Text style={{ fontSize: 18, fontWeight: 500, color: '#000000', lineHeight: '26px' }}>
                    Verify Bank Accounts
                </Text>

                {isLoading && (
                    <Flex justify="center" align="center" style={{ minHeight: 120 }}>
                        <Spin />
                    </Flex>
                )}

                {!isLoading && rows.length === 0 && (
                    <Flex justify="center" align="center" style={{ minHeight: 80 }}>
                        <Text style={{ fontSize: 14, color: '#6B788E' }}>
                            No accounts pending verification
                        </Text>
                    </Flex>
                )}

                {!isLoading && rows.length > 0 && (
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
                        {!hasResults && (
                            <Flex
                                align="center"
                                gap={16}
                                style={{
                                    paddingBottom: 14,
                                    marginBottom: 14,
                                    borderBottom: '1px solid #EAECF0',
                                }}
                            >
                                <Checkbox
                                    checked={selected.length === rows.length}
                                    indeterminate={selected.length > 0 && selected.length < rows.length}
                                    onChange={e =>
                                        setSelected(e.target.checked ? rows.map(r => r.key) : [])
                                    }
                                />
                                <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>
                                    Select All
                                </Text>
                            </Flex>
                        )}

                        {rows.map((emp, index) => {
                            const res = resultMap[emp.key];
                            return (
                                <Flex
                                    key={emp.key}
                                    vertical
                                    style={{
                                        paddingBottom: index < rows.length - 1 ? 14 : 0,
                                        marginBottom: index < rows.length - 1 ? 14 : 0,
                                        borderBottom: index < rows.length - 1 ? '1px solid #EAECF0' : 'none',
                                    }}
                                >
                                    <Flex align="center" gap={16}>
                                        {!hasResults && (
                                            <Checkbox
                                                checked={selected.includes(emp.key)}
                                                onChange={() => toggle(emp.key)}
                                            />
                                        )}
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
                                            <Text style={{ fontSize: 14, fontWeight: 600, color: '#FF9F9F' }}>
                                                {emp.initials}
                                            </Text>
                                        </Flex>
                                        <Flex vertical gap={2} style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: 600, color: '#101828', lineHeight: '20px' }}>
                                                {emp.name}
                                            </Text>
                                            <Text style={{ fontSize: 13, fontWeight: 400, color: '#6B788E', lineHeight: '20px' }}>
                                                Beneficiary: {emp.beneficiaryStatus}
                                            </Text>
                                        </Flex>
                                        {res && (
                                            res.success
                                                ? <CheckCircleOutlined style={{ fontSize: 18, color: '#12B76A', flexShrink: 0 }} />
                                                : <CloseCircleOutlined style={{ fontSize: 18, color: '#F04438', flexShrink: 0 }} />
                                        )}
                                    </Flex>
                                    {res && !res.success && (
                                        <Text style={{ fontSize: 12, color: '#F04438', marginTop: 6, marginLeft: 52 }}>
                                            {getFriendlyMessage(res)}
                                        </Text>
                                    )}
                                </Flex>
                            );
                        })}
                    </Flex>
                )}

                <Flex gap={10}>
                    <Button
                        block
                        style={{
                            height: 38,
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 500,
                            border: '1px solid #FF4F4F',
                            color: '#FF4F4F',
                            background: '#FFFFFF',
                        }}
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    {!hasResults && (
                        <Button
                            type="primary"
                            danger
                            block
                            disabled={selected.length === 0}
                            loading={isSubmitting}
                            onClick={handleConfirm}
                        >
                            Verify Account
                        </Button>
                    )}
                    {hasResults && (
                        <Button
                            type="primary"
                            danger
                            block
                            onClick={handleClose}
                        >
                            Done
                        </Button>
                    )}
                </Flex>
            </Flex>
        </Modal>
    );
};

export default VerifyAccountModal;
