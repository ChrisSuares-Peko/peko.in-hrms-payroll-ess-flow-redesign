import { useEffect, useRef, useState } from 'react';

import { Alert, Flex, Input, Typography } from 'antd';
import dayjs from 'dayjs';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useCancelOffBoardingApi } from '../../hooks/employeeHooks/useCancelOffBoardingApi';

interface CancelOffboardingModalProps {
    employeeId: string;
    handleCancel: () => void;
    /** Called after the offboarding is cancelled, to refresh the list or profile. */
    onCancelled: () => void;
}

const SETTLED_LABEL: Record<string, string> = {
    APPROVED: 'approved',
    INITIATED: 'sent for payment',
    PAID: 'paid',
    COMPLETED: 'paid',
};

// Opens once the offboarding is confirmed to still be cancellable (on or before the last
// working day); if it isn't, the hook toasts the reason and the modal closes.
const CancelOffboardingModal = ({ employeeId, handleCancel, onCancelled }: CancelOffboardingModalProps) => {
    const { preview, loadPreview, cancel, isCancelling } = useCancelOffBoardingApi();
    const [reason, setReason] = useState('');
    // Parents pass an inline close handler; a ref keeps it from re-running the preview fetch.
    const handleCancelRef = useRef(handleCancel);
    handleCancelRef.current = handleCancel;

    useEffect(() => {
        loadPreview(employeeId).then(ok => {
            if (!ok) handleCancelRef.current();
        });
    }, [employeeId, loadPreview]);

    if (!preview) return null;

    const handleSubmit = async () => {
        if (await cancel(employeeId, reason)) {
            handleCancel();
            onCancelled();
        }
    };

    const { settledSalary } = preview;

    return (
        <ConfirmationModal
            isOpen
            handleCancel={handleCancel}
            title={`Cancel offboarding for ${preview.fullName}?`}
            handleSubmit={handleSubmit}
            isLoading={isCancelling}
            customBody={
                <Flex vertical gap={10} className="w-full font-normal" data-testid="cancel-offboarding-body">
                    <Typography.Text className="text-sm">
                        Last working day {dayjs(preview.lastWorkingDay).format('D MMM YYYY')}. The employee
                        stays active with the same joining date, employee ID, probation state and salary.
                        The pending settlement is dropped and the withdrawn resignation is kept in their
                        history.
                    </Typography.Text>
                    {settledSalary && (
                        <Alert
                            type="warning"
                            showIcon
                            data-testid="cancel-offboarding-settlement-warning"
                            message={`The final salary for ${dayjs()
                                .month(settledSalary.month - 1)
                                .year(settledSalary.year)
                                .format('MMMM YYYY')} was already ${
                                SETTLED_LABEL[settledSalary.paymentStatus] || 'processed'
                            } in a payroll run, prorated to the last working day. Review it with your payroll team after cancelling.`}
                        />
                    )}
                    <Input.TextArea
                        rows={2}
                        placeholder="Reason (optional) — e.g. counter-offer accepted"
                        data-testid="cancel-offboarding-reason"
                        maxLength={200}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </Flex>
            }
        />
    );
};

export default CancelOffboardingModal;
