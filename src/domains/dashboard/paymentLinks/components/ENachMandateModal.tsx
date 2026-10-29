import { useEffect, useMemo, useState } from 'react';

import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Button, Card, Flex, Modal, Result, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

import ENachAuthView from './ENachAuthView';
import { ENACH_INITIAL_VALUES, ENachFormValues } from './ENachForm.types';
import ENachFormView from './ENachFormView';
import ENachInfoView from './ENachInfoView';
import useCheckENachMandateStatus from '../hooks/useCheckENachMandateStatus';
import { useCreateENachMandate } from '../hooks/useCreateENachMandate';


interface ENachMandateModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}
type ModalStep = 1 | 2 | 3 | 4;

const AUTH_WINDOW_SECONDS = 15 * 60;
const STEP_LABELS: ReadonlyArray<{ step: ModalStep; label: string }> = [
    { step: 1, label: 'Details' },
    { step: 2, label: 'Create' },
    { step: 3, label: 'Authorize' },
    { step: 4, label: 'Final Status' },
];
const SUCCESS_STATUSES = new Set(['ACTIVE', 'REGISTERED']);
const FAILED_STATUSES = new Set([
    'REJECTED',
    'EXPIRED',
    'SESSION_TIMEOUT',
    'SESSION_CANCELLED',
    'INACTIVE',
    'STALE',
    'FAILED',
    'FAILURE',
    'ERROR',
    'CANCELLED',
    'CANCELED',
]);

const getStatusType = (
    rawStatus: string | undefined,
    rawStatusType?: string
): 'pending' | 'success' | 'failed' => {
    const statusType = String(rawStatusType || '').toLowerCase();
    if (statusType === 'success' || statusType === 'failed' || statusType === 'pending') {
        return statusType;
    }

    const normalizedStatus = String(rawStatus || '').toUpperCase();
    if (SUCCESS_STATUSES.has(normalizedStatus)) return 'success';
    if (FAILED_STATUSES.has(normalizedStatus)) return 'failed';
    return 'pending';
};

const ENachStepProgress = ({ currentStep }: { currentStep: ModalStep }) => (
    <Flex align="center" justify="space-between" className="mb-6 px-1" gap={8}>
        {STEP_LABELS.map((item, index) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            const isUpcoming = currentStep < item.step;
            let pointBg = '#E5E7EB';
            if (isCompleted) pointBg = '#16A34A';
            if (isCurrent) pointBg = '#DC2626';
            const pointColor = isCompleted || isCurrent ? '#FFFFFF' : '#6B7280';
            const lineBg = currentStep > item.step ? '#16A34A' : '#E5E7EB';

            return (
                <Flex key={item.step} align="center" className="flex-1 min-w-0">
                    <Flex vertical align="center" className="min-w-[56px]">
                        <Flex
                            align="center"
                            justify="center"
                            className="h-6 w-6 rounded-full text-xs font-semibold"
                            style={{ background: pointBg, color: pointColor }}
                        >
                            {item.step}
                        </Flex>
                        <Typography.Text
                            className="mt-1 text-[11px] sm:text-xs text-center"
                            style={{ color: isUpcoming ? '#9CA3AF' : '#111827', fontWeight: isCurrent ? 600 : 500 }}
                        >
                            {item.label}
                        </Typography.Text>
                    </Flex>
                    {index < STEP_LABELS.length - 1 ? (
                        <Flex
                            className="h-[2px] flex-1 mx-2 rounded-full"
                            style={{ background: lineBg, minWidth: 12 }}
                        > </Flex>
                    ) : null}
                </Flex>
            );
        })}
    </Flex>
);

const ENachFinalStatusView = ({
    statusType,
    providerStatus,
    onCheckStatus,
    onClose,
    isCheckingStatus,
}: {
    statusType: 'success' | 'failed';
    providerStatus: string;
    onCheckStatus: () => void;
    onClose: () => void;
    isCheckingStatus: boolean;
}) => {
    const isSuccess = statusType === 'success';

    return (
        <Flex vertical gap={24} className="pt-2">
            <Result
                status={isSuccess ? 'success' : 'error'}
                icon={isSuccess ? <CheckCircleTwoTone twoToneColor="#52C41A" /> : <CloseCircleTwoTone twoToneColor="#EF4444" />}
                title={isSuccess ? 'Mandate Setup Successful' : 'Mandate Setup Failed'}
                subTitle={
                    isSuccess
                        ? `Mandate was verified successfully (${providerStatus}).`
                        : `Mandate verification failed (${providerStatus}).`
                }
            />

            <Card
                bordered={false}
                className="rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: '12px 16px', textAlign: 'center' } }}
            >
                <Typography.Text className="text-gray-500 text-xs">Provider Status</Typography.Text>
                <Typography.Title level={5} className="!mb-0 !mt-1">
                    {providerStatus || '-'}
                </Typography.Title>
            </Card>

            <Flex gap={12} wrap="wrap">
                <Button size="large" className="flex-1" onClick={onClose}>
                    Close
                </Button>
                <Button size="large" className="flex-1" loading={isCheckingStatus} onClick={onCheckStatus}>
                    Check Status Again
                </Button>
            </Flex>
        </Flex>
    );
};

const ENachMandateModal = ({ open, onClose, onSuccess }: ENachMandateModalProps) => {
    const { loading, submitMandate } = useCreateENachMandate();
    const { checkStatus, checkingReferenceId } = useCheckENachMandateStatus();
    const [currentStep, setCurrentStep] = useState<ModalStep>(1);
    const [form, setForm] = useState<ENachFormValues>(ENACH_INITIAL_VALUES);
    const [mandateLink, setMandateLink] = useState('');
    const [mandateReferenceId, setMandateReferenceId] = useState('');
    const [providerStatus, setProviderStatus] = useState('PENDING');
    const [statusType, setStatusType] = useState<'pending' | 'success' | 'failed'>('pending');
    const [timeLeft, setTimeLeft] = useState(AUTH_WINDOW_SECONDS);
    const dispatch = useDispatch()

    useEffect(() => {
        if (currentStep !== 3) {
            return undefined;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [currentStep]);

    const handleClose = () => {
        setCurrentStep(1);
        setForm(ENACH_INITIAL_VALUES);
        setMandateLink('');
        setMandateReferenceId('');
        setProviderStatus('PENDING');
        setStatusType('pending');
        setTimeLeft(AUTH_WINDOW_SECONDS);
        onClose();
    };

    const statusText = useMemo(() => {
        if (statusType === 'success') {
            return `Mandate verified successfully (${providerStatus}).`;
        }

        if (statusType === 'failed') {
            return `Mandate verification failed (${providerStatus}).`;
        }

        if (timeLeft <= 0) {
            return 'Link validity window appears to have ended. Use Check Status to verify final status.';
        }

        return 'Waiting for customer authorization. Use Check Status after completion.';
    }, [providerStatus, statusType, timeLeft]);

    const handleSubmitMandate = async (values: ENachFormValues) => {
        setForm(values);

        try {
            const calculatedEndDate = values.endDate || dayjs();

            console.log("submit")
            const result = await submitMandate({
                customer_name: values.customerName.trim(),
                customer_phone: values.mobile.trim(),
                customer_email: values.email.trim() || undefined,
                account_number: values.accountNumber.trim(),
                account_type: values.accountType.trim(),
                bank_code: values.bankCode.trim(),
                authentication_mode: values.authenticationMode,
                amount_rule: values.amountRule || "max",
                category_code: values.categoryCode || "OTH",
                amount: Number(values.amount),
                frequency: values.frequency || "Monthly",
                start_date: dayjs(values?.startDate).format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
                end_date: dayjs(calculatedEndDate)?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
            });

            console.log("working")
            const createdMandateLink = result.data?.mandate_link;
            const createdReferenceId = result.data?.reference_id;

            if (!createdMandateLink) {
                return;
            }

            if (!createdReferenceId) {
                return;
            }

            setMandateLink(createdMandateLink);
            setMandateReferenceId(createdReferenceId);
            const initialStatus = String(result.data?.status || 'PENDING').toUpperCase();
            setProviderStatus(initialStatus);
            setStatusType(getStatusType(initialStatus));
            setTimeLeft(AUTH_WINDOW_SECONDS);
            setCurrentStep(3);
            dispatch(showToast({
                description:"eNach Mandate created successfully",
                variant:"success"
            }))
            onSuccess?.();
        } catch (error) {
            console.log(error)
            dispatch(showToast({
                description: "Failed to submit eNACH Mandate. Please try again.",
                variant: "error"
            }));
        }
    };

    const handleCheckStatus = async () => {
        if (!mandateReferenceId) {
            message.error('Reference ID missing for this mandate');
            return;
        }

        const result = await checkStatus(mandateReferenceId);
        if (!result.success || !result.data) {
            message.error(result.message || 'Failed to fetch mandate status');
            return;
        }

        const latestStatus = String(result.data.status || 'PENDING').toUpperCase();
        const latestType = getStatusType(latestStatus, result.data.status_type);
        setProviderStatus(latestStatus);
        setStatusType(latestType);

        if (latestType === 'success') {
            message.success('Mandate verification successful');
            setCurrentStep(4);
            return;
        }

        if (latestType === 'failed') {
            message.error(`Mandate verification failed (${latestStatus})`);
            setCurrentStep(4);
            return;
        }

        message.info('Mandate is still pending');
    };

    let content = <ENachInfoView onBack={handleClose} onNext={() => setCurrentStep(2)} />;

    if (currentStep === 3) {
        content = (
            <ENachAuthView
                form={form}
                mandateLink={mandateLink}
                timeLeft={timeLeft}
                statusType={statusType}
                statusText={statusText}
                isCheckingStatus={checkingReferenceId === mandateReferenceId}
                onCancel={handleClose}
                onOpenMandateLink={() => window.open(mandateLink, '_blank', 'noopener,noreferrer')}
                onCheckStatus={handleCheckStatus}
            />
        );
    } else if (currentStep === 2) {
        content = (
            <ENachFormView
                initialValues={form}
                onBack={() => setCurrentStep(1)}
                onSubmit={handleSubmitMandate}
                loading={loading}
            />
        );
    } else if (currentStep === 4) {
        content = (
            <ENachFinalStatusView
                statusType={statusType === 'success' ? 'success' : 'failed'}
                providerStatus={providerStatus}
                onCheckStatus={handleCheckStatus}
                onClose={handleClose}
                isCheckingStatus={checkingReferenceId === mandateReferenceId}
            />
        );
    }

    return (
        <Modal
            open={open}
            // onCancel={handleClose}
            closable={false}
            footer={null}
            width={560}
            style={{ maxWidth: '95vw' }}
            centered
            className="rounded-3xl"
            classNames={{content:"!rounded-3xl"}}
        >
            <ENachStepProgress currentStep={currentStep} />
            {content}
        </Modal>
    );
};

export default ENachMandateModal;
