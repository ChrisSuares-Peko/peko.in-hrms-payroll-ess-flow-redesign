import { useState } from 'react';

import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Modal, Spin, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import dangerIcon from '@src/domains/dashboard/settings/assets/danger.svg';
import documentIcon from '@src/domains/dashboard/settings/assets/document.svg';

interface CancelSubscriptionModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    handleSubmit: () => void;
    isLoading: boolean;
    packageName: string;
    // null when the count couldn't be fetched
    employeeCount: number | null;
    dataDeletionDate?: Date | null;
    accessEndDate?: Date | null;
    showPayrollWarning: boolean;
    // Employee count / limit still loading — hold the decision and the confirm button.
    isCheckingPayroll?: boolean;
    // Optional override for the info-box body text shown when showPayrollWarning is false.
    // Pass a custom note (e.g. WA's "Cancelling will also remove your add-ons" warning) to keep
    // the new Figma-styled modal while preserving caller-specific copy.
    description?: React.ReactNode;
    // Employees included on the free/Basic plan, shown alongside the count when supplied.
    // null = couldn't be resolved → warn without a number.
    freeEmployeeLimit?: number | null;
}

const formatDeletionDate = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

const CancelSubscriptionModal = ({
    isOpen,
    handleCancel,
    handleSubmit,
    isLoading,
    packageName,
    employeeCount,
    dataDeletionDate,
    accessEndDate,
    showPayrollWarning,
    isCheckingPayroll = false,
    description,
    freeEmployeeLimit,
}: CancelSubscriptionModalProps) => {
    const [acknowledged, setAcknowledged] = useState(false);
    const canConfirm = !isCheckingPayroll && (showPayrollWarning ? acknowledged : true);
    const hasFreeLimit = typeof freeEmployeeLimit === 'number';
    const isUnresolved = employeeCount === null || freeEmployeeLimit === null;
    // Going over the Basic limit resets payroll for every employee, not just the excess.
    const affectedCount = employeeCount ?? 0;
    const affectedWord = affectedCount === 1 ? 'employee' : 'employees';
    const limitWord = freeEmployeeLimit === 1 ? 'employee' : 'employees';

    const onClose = () => {
        setAcknowledged(false);
        handleCancel();
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width="min(720px, calc(100vw - 32px))"
            destroyOnHidden
            styles={{
                body: { padding: 0 },
                content: { padding: 0, borderRadius: 16, overflow: 'hidden' },
            }}
        >
            <Flex vertical>
                <Flex
                    justify="space-between"
                    align="center"
                    className="px-5 sm:px-8 pt-5 sm:pt-7 pb-3 sm:pb-4"
                >
                    <Flex align="center" gap={14} className="sm:!gap-[18px] flex-1 min-w-0">
                        <Flex
                            align="center"
                            justify="center"
                            className="hidden sm:flex w-16 h-16 rounded-full bg-iconBgRed flex-shrink-0"
                        >
                            <ReactSVG
                                src={dangerIcon}
                                className="flex items-center justify-center"
                            />
                        </Flex>
                        <Typography.Text className="text-lg sm:text-2xl font-semibold text-textBlack leading-6 sm:leading-8">
                            Cancel {packageName} subscription?
                        </Typography.Text>
                    </Flex>
                    <Button
                        type="text"
                        icon={<CloseOutlined className="text-textGreyColor text-lg sm:text-xl" />}
                        onClick={onClose}
                        aria-label="Close"
                        className="flex-shrink-0"
                    />
                </Flex>

                <Flex vertical className="px-5 sm:px-8 pb-5 sm:pb-7">
                    {isCheckingPayroll && (
                        <Flex justify="center" align="center" className="min-h-[60px] mb-5 sm:mb-6">
                            <Spin />
                        </Flex>
                    )}
                    {!isCheckingPayroll && showPayrollWarning && (
                        <Flex
                            gap={14}
                            align="start"
                            className="rounded-xl px-4 sm:px-5 py-4 mb-5 sm:mb-6 bg-bgLightPink border border-solid border-borderPrimaryLight"
                        >
                            <ReactSVG
                                src={documentIcon}
                                className="hidden sm:flex items-center justify-center flex-shrink-0 mt-0.5"
                            />
                            <Flex vertical gap={10} className="flex-1">
                                <Typography.Text className="text-textMoroon text-[15px] sm:text-base leading-6">
                                    {isUnresolved ? (
                                        <>
                                            If you have more employees than your Basic plan
                                            allows, payroll data for all your employees will be
                                            reset. Are you sure you want to proceed?
                                        </>
                                    ) : (
                                        <>
                                            {hasFreeLimit && (
                                                <>
                                                    Your Basic plan includes{' '}
                                                    <strong>
                                                        {freeEmployeeLimit} {limitWord}
                                                    </strong>{' '}
                                                    and you have {affectedCount}.{' '}
                                                </>
                                            )}
                                            Payroll data for all{' '}
                                            <strong>
                                                {affectedCount} {affectedWord}
                                            </strong>{' '}
                                            will be reset. Are you sure you want to proceed?
                                        </>
                                    )}
                                </Typography.Text>
                                {dataDeletionDate && (
                                    <Typography.Text className="text-textMoroon text-sm sm:text-[15px] leading-[22px]">
                                        <Typography.Text className="font-medium text-textMoroon">
                                            Note:
                                        </Typography.Text>{' '}
                                        The data will be deleted on{' '}
                                        <strong>{formatDeletionDate(dataDeletionDate)}</strong>.
                                    </Typography.Text>
                                )}
                            </Flex>
                        </Flex>
                    )}
                    {!isCheckingPayroll && !showPayrollWarning && (
                        <Flex
                            gap={8}
                            align="center"
                            className="rounded-[10px] px-4 sm:px-[17px] py-4 mb-5 sm:mb-6 bg-bgGrayF9 border border-solid border-borderGray min-h-[60px]"
                        >
                            <InfoCircleOutlined className="text-textBlack text-base flex-shrink-0" />
                            <Typography.Text className="text-textBlack text-sm sm:text-base leading-[22px]">
                                {description ?? (
                                    <>
                                        {`You'll keep access to all ${packageName} features`}
                                        {accessEndDate ? (
                                            <>
                                                {' until '}
                                                <span className="font-medium">
                                                    {formatDeletionDate(accessEndDate)}
                                                </span>
                                            </>
                                        ) : (
                                            ' until the end of your current billing cycle'
                                        )}
                                        .
                                    </>
                                )}
                            </Typography.Text>
                        </Flex>
                    )}

                    {showPayrollWarning && !isCheckingPayroll && (
                        <Flex align="start" gap={12}>
                            <Checkbox
                                checked={acknowledged}
                                onChange={e => setAcknowledged(e.target.checked)}
                                className="[&_.ant-checkbox]:!top-0 mt-[2px]"
                            />
                            <Typography.Text
                                onClick={() => setAcknowledged(!acknowledged)}
                                className="text-textDarkGray text-sm sm:text-[15px] leading-[22px] cursor-pointer select-none"
                            >
                                I understand that payroll data for{' '}
                                {isUnresolved
                                    ? 'all my employees'
                                    : `all ${affectedCount} ${affectedWord}`}{' '}
                                will be permanently deleted and cannot be recovered.
                            </Typography.Text>
                        </Flex>
                    )}
                </Flex>

                <Flex
                    gap={12}
                    className="px-5 sm:px-8 py-4 sm:py-5 sm:!gap-4 flex-col sm:flex-row bg-bgGrayF9 border-0 border-t border-solid border-skeltonGray"
                >
                    <Button
                        block
                        size="large"
                        danger
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-[52px] text-base font-medium"
                    >
                        Keep subscription
                    </Button>
                    <Button
                        block
                        size="large"
                        type="primary"
                        danger
                        loading={isLoading}
                        disabled={!canConfirm}
                        onClick={handleSubmit}
                        className="h-[52px] text-base font-medium"
                    >
                        Yes, cancel subscription
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default CancelSubscriptionModal;
