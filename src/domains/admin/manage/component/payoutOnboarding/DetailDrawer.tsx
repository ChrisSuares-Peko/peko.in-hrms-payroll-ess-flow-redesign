import React, { useEffect, useState } from 'react';

import { Button, Drawer, Flex, Select, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import {
    AdminPayoutOnboardingRecord,
    UpdatePayoutOnboardingStatusPayload,
} from '../../types/payoutOnboarding';

const { Text } = Typography;

interface InfoRowProps {
    label: string;
    value: string | null | undefined;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
    <Flex justify="space-between" className="mt-4 border-b border-[#f0f0f0] pb-4">
        <Text className="text-sm text-[#667085]">{label}</Text>
        <Text className="text-sm font-medium text-[#1F2A44]">{value || 'N/A'}</Text>
    </Flex>
);

const STATUS_OPTIONS = [
    { value: 'approval-pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
];

interface Props {
    open: boolean;
    data?: AdminPayoutOnboardingRecord;
    onClose: () => void;
    onUpdateStatus: (payload: UpdatePayoutOnboardingStatusPayload) => void;
    isLoading: boolean;
}

const PayoutOnboardingDetailDrawer = ({
    open,
    data,
    onClose,
    onUpdateStatus,
    isLoading,
}: Props) => {
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(data?.status);

    useEffect(() => {
        setSelectedStatus(data?.status);
    }, [open, data?.status]);

    const handleSubmit = () => {
        if (data && selectedStatus) {
            onUpdateStatus({ onboardingId: data.id, status: selectedStatus as any });
        }
    };

    const handleClose = () => {
        setSelectedStatus(data?.status);
        onClose();
    };

    return (
        <Drawer
            title="Payout Onboarding Details"
            width={520}
            onClose={handleClose}
            open={open}
            footer={
                <Flex justify="end" gap={12}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        type="primary"
                        danger
                        onClick={handleSubmit}
                        loading={isLoading}
                        disabled={!selectedStatus}
                    >
                        Update Status
                    </Button>
                </Flex>
            }
        >
            <Flex vertical>
                <Text className="text-sm font-semibold uppercase tracking-wide text-[#475467]">
                    Corporate Details
                </Text>

                <InfoRow label="Corporate Name" value={data?.corporateName} />
                <InfoRow label="Business Name" value={data?.businessName} />
                <InfoRow label="Phone" value={data?.phone} />

                <Text className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#475467]">
                    KYC Details
                </Text>

                <InfoRow label="PAN" value={data?.pan} />
                <InfoRow
                    label="PAN Verified At"
                    value={
                        data?.panVerifiedAt
                            ? `${formattedDateOnly(new Date(data.panVerifiedAt))} ${formattedTime(new Date(data.panVerifiedAt))}`
                            : null
                    }
                />
                <InfoRow label="Bank Name" value={data?.bankName} />
                <InfoRow label="Account Number" value={data?.accountNumber} />
                <InfoRow label="IFSC Code" value={data?.ifsc} />
                <InfoRow label="Account Holder Name" value={data?.accountHolderName} />
                <InfoRow
                    label="Bank Verified At"
                    value={
                        data?.bankVerifiedAt
                            ? `${formattedDateOnly(new Date(data.bankVerifiedAt))} ${formattedTime(new Date(data.bankVerifiedAt))}`
                            : null
                    }
                />

                <Text className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#475467]">
                    Activation
                </Text>

                <InfoRow
                    label="Consent Accepted At"
                    value={
                        data?.consentAcceptedAt
                            ? `${formattedDateOnly(new Date(data.consentAcceptedAt))} ${formattedTime(new Date(data.consentAcceptedAt))}`
                            : null
                    }
                />
                <InfoRow label="Virtual Account Number" value={data?.virtualAccountNumber} />
                <InfoRow label="Virtual IFSC" value={data?.virtualIfsc} />
                <InfoRow
                    label="Activated At"
                    value={
                        data?.activatedAt
                            ? `${formattedDateOnly(new Date(data.activatedAt))} ${formattedTime(new Date(data.activatedAt))}`
                            : null
                    }
                />

                <Text className="mt-6 text-sm font-semibold uppercase tracking-wide text-[#475467]">
                    Change Status
                </Text>

                <Flex vertical gap={8} className="mt-4">
                    <Text className="text-sm text-[#667085]">Select new status</Text>
                    <Select
                        placeholder="Select status"
                        options={STATUS_OPTIONS}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        className="w-full"
                    />
                </Flex>
            </Flex>
        </Drawer>
    );
};

export default PayoutOnboardingDetailDrawer;
