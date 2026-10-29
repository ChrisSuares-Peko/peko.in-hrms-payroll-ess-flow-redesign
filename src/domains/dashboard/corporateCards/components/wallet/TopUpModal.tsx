import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Empty, message, Modal, Skeleton, Typography } from 'antd';

import copyIcon from '../../assets/icons/copy.svg';
import { FundingAccountDetails } from '../../utils/types';
import { ROUNDED_MODAL_CLASSNAMES } from '../common/modalProps';

const { Text } = Typography;

interface TopUpModalProps {
    open: boolean;
    onClose: () => void;
    /** Funding account, or null when it hasn't been provisioned yet. */
    details: FundingAccountDetails | null;
    loading?: boolean;
}

const BankField = ({ label, value }: { label: string; value: string }) => {
    const hasValue = Boolean(value);
    const handleCopy = () => {
        if (!hasValue) return;
        navigator.clipboard.writeText(value);
        message.success(`${label} copied`);
    };

    return (
        <div className="flex items-center justify-between rounded-xl bg-[#FAFAFA] px-4 py-3">
            <div className="flex flex-col gap-0.5">
                <Text className="text-xs text-textGreyLight">{label}</Text>
                <Text className="whitespace-pre-line text-sm font-medium text-textHeadings">
                    {value || '—'}
                </Text>
            </div>
            <button
                type="button"
                aria-label={`Copy ${label}`}
                onClick={handleCopy}
                disabled={!hasValue}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bgLightPink transition-colors hover:bg-bgOrangeShade disabled:cursor-not-allowed disabled:opacity-40"
            >
                <img src={copyIcon} alt="" className="h-5 w-5" />
            </button>
        </div>
    );
};

const TopUpModal = ({ open, onClose, details, loading }: TopUpModalProps) => {
    const handleCopyAll = () => {
        if (!details) return;
        const lines = [
            `Beneficiary name: ${details.beneficiaryName}`,
            `Account Number: ${details.accountNumber}`,
            `IFSC Code: ${details.ifscCode}`,
            `Bank Name: ${details.bankName}`,
            `Bank Address: ${details.bankAddress}`,
            `Payment reference: ${details.paymentReference}`,
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        message.success('All details copied');
    };

    const renderBody = () => {
        if (loading) {
            return <Skeleton active paragraph={{ rows: 6 }} />;
        }
        if (!details) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <Text className="text-sm text-textBody">
                            Your funding account isn&apos;t set up yet. Please contact support at
                            reach@peko.one to enable wallet top-ups.
                        </Text>
                    }
                />
            );
        }
        return (
            <div className="flex flex-col gap-4">
                <Text className="text-sm leading-relaxed text-textBody">
                    Transfer funds via NEFT / RTGS / IMPS to your company&apos;s unique account
                    below. Once received, the wallet balance updates automatically and funds become
                    available to allocate to cards.
                </Text>

                <div className="flex flex-col gap-3">
                    <BankField label="Beneficiary name" value={details.beneficiaryName} />
                    <BankField label="Account Number" value={details.accountNumber} />
                    <BankField label="IFSC Code" value={details.ifscCode} />
                    <BankField label="Bank Name" value={details.bankName} />
                    <BankField label="Bank Address" value={details.bankAddress} />
                    <BankField
                        label="Payment reference (required)"
                        value={details.paymentReference}
                    />
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-listBg p-3">
                    <InfoCircleOutlined className="mt-0.5 shrink-0 text-textBody" />
                    <Text className="text-xs leading-relaxed text-textBody">
                        Always include the payment reference so we can auto-match your transfer.
                        NEFT & IMPS settle within minutes; RTGS settles instantly during banking
                        hours.
                    </Text>
                </div>
            </div>
        );
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            destroyOnHidden
            centered
            width="min(480px, 92vw)"
            classNames={ROUNDED_MODAL_CLASSNAMES}
            title="Top up wallet — bank transfer details"
            footer={
                <div className="flex gap-3">
                    <Button onClick={onClose} className="flex-1">
                        Close
                    </Button>
                    <Button
                        type="primary"
                        icon={<img src={copyIcon} alt="" className="h-4 w-4 brightness-0 invert" />}
                        onClick={handleCopyAll}
                        disabled={loading || !details}
                        className="flex-1"
                    >
                        Copy all Details
                    </Button>
                </div>
            }
        >
            {renderBody()}
        </Modal>
    );
};

export default TopUpModal;
