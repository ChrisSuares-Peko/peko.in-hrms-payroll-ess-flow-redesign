import { useCallback, useEffect, useMemo, useState } from 'react';

import { message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { executeENachMandatePayment, getENachMandateExecutions, manageENachMandate } from '../api';
import {
    ENachMandateExecutionListItem,
    ENachMandateInitiationGuard,
    ENachMandateListItem,
} from '../types/paymentLinkTypes';
import { formatAmount } from '../utils/data';

const EXECUTION_PAGE_SIZE = 5;
const DEBIT_DATE_VALIDATION_MESSAGE =
    'Debit date should have at least 2 days gap from the mandate start date. Please provide a valid Debit date. Hint: debit_date(string), format: yyyy-mm-dd';
const MANAGE_AND_INITIATE_LOCKED_STATUSES = new Set([
    'REJECTED',
    'CANCELLED',
    'CANCELED',
    'CANCELLATION_PENDING',
]);

interface UseENachManageModalArgs {
    open: boolean;
    mandate: ENachMandateListItem | null;
    onUpdated?: () => void;
}

const useENachManageModal = ({ open, mandate, onUpdated }: UseENachManageModalArgs) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isCancelling, setIsCancelling] = useState(false);
    const [isInitiating, setIsInitiating] = useState(false);
    const [isFetchingPayments, setIsFetchingPayments] = useState(false);
    const [payments, setPayments] = useState<ENachMandateExecutionListItem[]>([]);
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentTotal, setPaymentTotal] = useState(0);
    const [initiationGuard, setInitiationGuard] = useState<ENachMandateInitiationGuard | null>(null);
    const [currentStatus, setCurrentStatus] = useState('');
    const [debitDate, setDebitDate] = useState<Dayjs | null>(null);
    const [debitDateError, setDebitDateError] = useState('');
    const [initiateAmount, setInitiateAmount] = useState(0);
    const [amountError, setAmountError] = useState('');
    const [isInitiateDrawerOpen, setIsInitiateDrawerOpen] = useState(false);

    const referenceId = mandate?.reference_id;
    const mandateAmount = Number(mandate?.amount || 0);
    const isAmountRuleMax = String(mandate?.amount_rule || '').toLowerCase() === 'max';
    const isManageAndInitiateLocked = MANAGE_AND_INITIATE_LOCKED_STATUSES.has(currentStatus);

    const minDebitDate = useMemo(() => {
        const today = dayjs().startOf('day');
        const mandateStartDate = mandate?.start_date ? dayjs(mandate.start_date).startOf('day') : null;
        if (!mandateStartDate || !mandateStartDate.isValid()) {
            return today;
        }
        const startWithGap = mandateStartDate.add(2, 'day');
        return startWithGap.isAfter(today) ? startWithGap : today;
    }, [mandate?.start_date]);

    const normalizedInitiateAmount = Number(initiateAmount);
    const isAmountInvalid =
        !Number.isFinite(normalizedInitiateAmount) ||
        normalizedInitiateAmount <= 0 ||
        (isAmountRuleMax ? normalizedInitiateAmount > mandateAmount : normalizedInitiateAmount !== mandateAmount);
    const isDebitDateInvalid =
        !debitDate || !debitDate.isValid() || debitDate.startOf('day').isBefore(minDebitDate, 'day');
    const isFrequencyInitiationLocked = initiationGuard?.can_initiate === false;
    const initiationGuardMessage = initiationGuard?.message || '';
    const nextAllowedAtLabel = initiationGuard?.next_allowed_at
        ? dayjs(initiationGuard.next_allowed_at).format('DD MMM YYYY, hh:mm A')
        : null;
    const showNextAllowedAt = !isManageAndInitiateLocked && isFrequencyInitiationLocked && Boolean(nextAllowedAtLabel);

    let initiationEligibilityMessage = initiationGuardMessage || 'Eligible to initiate now.';
    if (isManageAndInitiateLocked) {
        initiationEligibilityMessage = `Initiation is disabled because mandate status is ${currentStatus || '-'}.`;
    } else if (isFrequencyInitiationLocked) {
        initiationEligibilityMessage =
            initiationGuardMessage || 'Initiation is currently locked for this mandate frequency.';
    }

    const initiationEligibilityToneColor =
        isManageAndInitiateLocked || isFrequencyInitiationLocked ? '#D97706' : '#059669';
    const isInitiateDisabled =
        !referenceId ||
        mandateAmount <= 0 ||
        isManageAndInitiateLocked ||
        isFrequencyInitiationLocked ||
        isDebitDateInvalid ||
        isAmountInvalid ||
        isInitiating;
    const isInitiateActionDisabled =
        !referenceId || mandateAmount <= 0 || isManageAndInitiateLocked || isFrequencyInitiationLocked;

    useEffect(() => {
        setCurrentStatus(String(mandate?.status || '').toUpperCase());
    }, [mandate?.status, mandate?.reference_id]);

    useEffect(() => {
        if (!open) {
            setDebitDate(null);
            setDebitDateError('');
            setInitiateAmount(0);
            setAmountError('');
            setIsInitiateDrawerOpen(false);
            setInitiationGuard(null);
            return;
        }
        setDebitDate(minDebitDate);
        setInitiateAmount(mandateAmount);
        setDebitDateError('');
        setAmountError('');
    }, [minDebitDate, open, mandate?.reference_id, mandateAmount]);

    useEffect(() => {
        if (debitDateError && !isDebitDateInvalid) {
            setDebitDateError('');
        }
    }, [debitDateError, isDebitDateInvalid]);

    useEffect(() => {
        if (amountError && !isAmountInvalid) {
            setAmountError('');
        }
    }, [amountError, isAmountInvalid]);

    const fetchPayments = useCallback(
        async (page: number) => {
            if (!referenceId) return;

            setIsFetchingPayments(true);
            try {
                const response = await getENachMandateExecutions({
                    userId: id,
                    userType: role,
                    reference_id: referenceId,
                    page,
                    limit: EXECUTION_PAGE_SIZE,
                });
                setPayments(response.rows || []);
                setPaymentTotal(Number(response.total || 0));
                setPaymentPage(page);
                setInitiationGuard(response.initiation_guard || null);
            } catch (error: any) {
                message.error(error?.response?.data?.message || 'Failed to fetch payment history');
            } finally {
                setIsFetchingPayments(false);
            }
        },
        [id, referenceId, role]
    );

    useEffect(() => {
        if (!open || !referenceId) return;
        fetchPayments(1);
    }, [fetchPayments, open, referenceId]);

    const handleCancelMandate = async () => {
        if (!referenceId) return;

        setIsCancelling(true);
        try {
            const result = await manageENachMandate({
                userId: id,
                userType: role,
                reference_id: referenceId,
            });

            setCurrentStatus(String(result?.status || currentStatus).toUpperCase());
            message.success(
                result?.message ||
                    (result?.status
                        ? `Mandate action initiated (${result.status})`
                        : 'Mandate action initiated successfully')
            );
            onUpdated?.();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Failed to process mandate action');
        } finally {
            setIsCancelling(false);
        }
    };

    const openInitiateDrawer = () => {
        if (isInitiateActionDisabled) return;
        setDebitDate(minDebitDate);
        setInitiateAmount(mandateAmount);
        setDebitDateError('');
        setAmountError('');
        setIsInitiateDrawerOpen(true);
    };

    const closeInitiateDrawer = () => {
        if (isInitiating) return;
        setIsInitiateDrawerOpen(false);
        setDebitDateError('');
        setAmountError('');
    };

    const handleInitiatePayment = async () => {
        if (!referenceId) {
            message.error('Mandate reference ID is missing');
            return;
        }

        if (!Number.isFinite(mandateAmount) || mandateAmount <= 0) {
            message.error('Invalid mandate amount for initiating payment');
            return;
        }

        if (isFrequencyInitiationLocked) {
            message.error(initiationGuardMessage || 'Payment initiation is locked for this mandate frequency window.');
            return;
        }

        if (isAmountInvalid) {
            if (isAmountRuleMax && normalizedInitiateAmount > mandateAmount) {
                setAmountError(`Amount cannot exceed mandate max amount (${formatAmount(mandateAmount)}).`);
            } else if (!isAmountRuleMax) {
                setAmountError(`Amount is fixed for this mandate (${formatAmount(mandateAmount)}).`);
            } else {
                setAmountError('Please enter a valid amount greater than 0.');
            }
            return;
        }

        if (!debitDate || !debitDate.isValid() || debitDate.startOf('day').isBefore(minDebitDate, 'day')) {
            setDebitDateError(DEBIT_DATE_VALIDATION_MESSAGE);
            return;
        }

        setIsInitiating(true);
        setDebitDateError('');
        try {
            const result = await executeENachMandatePayment({
                userId: id,
                userType: role,
                reference_id: referenceId,
                amount: normalizedInitiateAmount,
                debit_date: debitDate.format('YYYY-MM-DD'),
            });

            message.success(
                result?.status
                    ? `Payment initiation submitted (${result.status})`
                    : 'Payment initiation submitted successfully'
            );
            setIsInitiateDrawerOpen(false);
            await fetchPayments(1);
            onUpdated?.();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to initiate payment';
            if (String(errorMessage).toLowerCase().includes('debit date')) {
                setDebitDateError(errorMessage);
            }
            message.error(errorMessage);
        } finally {
            setIsInitiating(false);
        }
    };

    const handleAmountChange = (value: number | null) => {
        setInitiateAmount(Number(value || 0));
        if (amountError) setAmountError('');
    };

    const handleDebitDateChange = (value: Dayjs | null) => {
        setDebitDate(value);
        if (debitDateError) setDebitDateError('');
    };

    const disabledDebitDate = (current: Dayjs | null) =>
        !current || current.startOf('day').isBefore(minDebitDate, 'day');

    return {
        currentStatus,
        mandateAmount,
        isManageAndInitiateLocked,
        isCancelling,
        handleCancelMandate,
        payments,
        paymentPage,
        paymentTotal,
        isFetchingPayments,
        fetchPayments,
        openInitiateDrawer,
        isInitiateActionDisabled,
        initiationEligibilityMessage,
        initiationEligibilityToneColor,
        showNextAllowedAt,
        nextAllowedAtLabel,
        isInitiateDrawerOpen,
        closeInitiateDrawer,
        handleInitiatePayment,
        isInitiating,
        isInitiateDisabled,
        isAmountRuleMax,
        initiateAmount,
        handleAmountChange,
        amountError,
        debitDate,
        handleDebitDateChange,
        debitDateError,
        isDateDisabled: !referenceId || isManageAndInitiateLocked || isFrequencyInitiationLocked,
        disabledDebitDate,
        minDebitDateLabel: minDebitDate.format('YYYY-MM-DD'),
    };
};

export { EXECUTION_PAGE_SIZE };
export default useENachManageModal;
