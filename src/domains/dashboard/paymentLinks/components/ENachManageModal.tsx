
import { Grid, Modal, Tabs } from 'antd';

import ENachInitiatePaymentDrawer from './ENachInitiatePaymentDrawer';
import ENachManageActionsTab from './ENachManageActionsTab';
import ENachManagePaymentsTab from './ENachManagePaymentsTab';
import ENachManageSummaryCard from './ENachManageSummaryCard';
import useENachManageModal, { EXECUTION_PAGE_SIZE } from '../hooks/useENachManageModal';
import { ENachMandateListItem } from '../types/paymentLinkTypes';
import { paymentColumns } from '../utils/data';

interface ENachManageModalProps {
    open: boolean;
    mandate: ENachMandateListItem | null;
    onClose: () => void;
    onUpdated?: () => void;
}

const ENachManageModal = ({ open, mandate, onClose, onUpdated }: ENachManageModalProps) => {
    const screens = Grid.useBreakpoint();
    const {
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
        isDateDisabled,
        disabledDebitDate,
        minDebitDateLabel,
    } = useENachManageModal({ open, mandate, onUpdated });


    return (
        <Modal
            open={open}
            title="Manage eNACH Mandate"
            onCancel={onClose}
            footer={null}
            width={980}
            destroyOnClose
        >
            <ENachManageSummaryCard mandate={mandate} mandateAmount={mandateAmount} currentStatus={currentStatus} />

            <Tabs
                defaultActiveKey="payments"
                items={[
                    {
                        key: 'manage',
                        label: 'Manage eNACH',
                        disabled: isManageAndInitiateLocked,
                        children: (
                            <ENachManageActionsTab
                                isManageAndInitiateLocked={isManageAndInitiateLocked}
                                isCancelling={isCancelling}
                                onCancelMandate={handleCancelMandate}
                            />
                        ),
                    },
                    {
                        key: 'payments',
                        label: 'Payments Initiated',
                        children: (
                            <ENachManagePaymentsTab
                                payments={payments}
                                paymentColumns={paymentColumns}
                                paymentPage={paymentPage}
                                paymentTotal={paymentTotal}
                                isFetchingPayments={isFetchingPayments}
                                onRefresh={() => fetchPayments(paymentPage)}
                                onOpenInitiateDrawer={openInitiateDrawer}
                                onPageChange={fetchPayments}
                                isInitiateDisabled={isInitiateActionDisabled}
                                initiationEligibilityMessage={initiationEligibilityMessage}
                                initiationEligibilityToneColor={initiationEligibilityToneColor}
                                showNextAllowedAt={showNextAllowedAt}
                                nextAllowedAtLabel={nextAllowedAtLabel}
                                pageSize={EXECUTION_PAGE_SIZE}
                            />
                        ),
                    },
                ]}
            />

            <ENachInitiatePaymentDrawer
                open={isInitiateDrawerOpen}
                width={screens.sm ? 460 : '100%'}
                onClose={closeInitiateDrawer}
                onSubmit={handleInitiatePayment}
                isInitiating={isInitiating}
                isInitiateDisabled={isInitiateDisabled}
                mandateAmount={mandateAmount}
                isAmountRuleMax={isAmountRuleMax}
                initiateAmount={initiateAmount}
                onAmountChange={handleAmountChange}
                amountError={amountError}
                debitDate={debitDate}
                onDebitDateChange={handleDebitDateChange}
                debitDateError={debitDateError}
                isDateDisabled={isDateDisabled}
                disabledDate={disabledDebitDate}
                minDebitDateLabel={minDebitDateLabel}
                initiationEligibilityMessage={initiationEligibilityMessage}
                initiationEligibilityToneColor={initiationEligibilityToneColor}
                showNextAllowedAt={showNextAllowedAt}
                nextAllowedAtLabel={nextAllowedAtLabel}
            />
        </Modal>
    );
};

export default ENachManageModal;
