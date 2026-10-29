import {
    BankOutlined,
    BulbOutlined,
    CopyOutlined,
    PlusOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { Button, Card, Flex, Modal, Typography, message } from 'antd';

import { getPrimaryBankApi } from '../../api/collectPayment';
import { TRANSFER_METHODS } from '../../constants/collectPayment';
import { copyBankDetails, shareViaWhatsApp } from '../../utils/helperFunctions';
import CopyableRow from '../shared/CopyableRow';
import InfoCard from '../shared/InfoCard';
import LeftHeader from '../shared/LeftHeader';

type PrimaryBank = Awaited<ReturnType<typeof getPrimaryBankApi>>;

interface BankTransferModalProps {
    open: boolean;
    onCancel: () => void;
    details: PrimaryBank;
    onAddBankAccount: () => void;
}

const BankTransferModal = ({
    open,
    onCancel,
    details,
    onAddBankAccount,
}: BankTransferModalProps) => {
    const rows = [
        { label: 'Account Name', value: details?.accountHolderName },
        { label: 'Bank Name', value: details?.bankName },
        { label: 'Account Number', value: details?.accountNumber },
        { label: 'IFSC Code', value: details?.ifscCode },
        { label: 'Branch Name', value: details?.bankBranch },
    ].filter((r): r is { label: string; value: string } => !!r.value);

    const copyAllDetails = () => {
        copyBankDetails(rows);
        message.success('All details copied to clipboard');
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={560}
            closable={false}
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:overflow-hidden"
            styles={{ body: { maxHeight: '85vh', overflowY: 'auto' } }}
        >
            <Flex vertical gap={20} className="p-7">
                <LeftHeader
                    title="Bank Transfer Details"
                    description="Share these details with your customer for NEFT, RTGS, or IMPS transfers"
                />

                <Card className="rounded-2xl shadow-sm border-stone-200">
                    <Flex vertical gap={16}>
                        {!details ? (
                            <Flex
                                vertical
                                align="center"
                                gap={12}
                                className="border border-dashed border-[#e2e8f0] bg-[#F8FAFC] rounded-2xl py-8 px-4"
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="w-14 h-14 rounded-full bg-[#FFF0F0]"
                                >
                                    <BankOutlined className="text-2xl text-[#FF4F4F]" />
                                </Flex>
                                <Flex vertical align="center" gap={4}>
                                    <Typography.Text className="text-base font-semibold text-[#1F2633]">
                                        No Bank Account Added
                                    </Typography.Text>
                                    <Typography.Text className="text-sm text-[#6A7282] text-center">
                                        Add your bank account details to start receiving payments
                                        via NEFT, RTGS, or IMPS.
                                    </Typography.Text>
                                </Flex>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<PlusOutlined />}
                                    className="h-10 px-6 w-full"
                                    onClick={onAddBankAccount}
                                >
                                    Add Bank Account
                                </Button>
                            </Flex>
                        ) : (
                            <>
                                <LeftHeader
                                    title="Bank Account"
                                    titleClass="text-base"
                                    description="Use for direct bank transfers"
                                    descriptionClass="text-xs"
                                />
                                <Flex vertical gap={8}>
                                    {rows.map(row => (
                                        <CopyableRow
                                            key={row.label}
                                            title={row.label}
                                            description={row.value}
                                        />
                                    ))}
                                </Flex>
                            </>
                        )}

                        {details && (
                            <>
                                <Button
                                    type="primary"
                                    danger
                                    block
                                    className="h-10"
                                    icon={<CopyOutlined />}
                                    onClick={copyAllDetails}
                                >
                                    Copy all Details
                                </Button>
                                <Button
                                    block
                                    className="h-10"
                                    icon={<WhatsAppOutlined />}
                                    onClick={() =>
                                        shareViaWhatsApp(
                                            `Bank Transfer Details:\n${rows.map(r => `${r.label}: ${r.value}`).join('\n')}`
                                        )
                                    }
                                >
                                    Share via WhatsApp
                                </Button>
                            </>
                        )}
                    </Flex>
                </Card>

                <InfoCard
                    titleIcon={<BulbOutlined className="text-lg" />}
                    title="Supported Transfer Methods"
                    items={TRANSFER_METHODS.map(({ name, description }) => (
                        <>
                            <Typography.Text className="text-sm font-semibold">
                                {name}
                            </Typography.Text>
                            {` - ${description}`}
                        </>
                    ))}
                />
            </Flex>
        </Modal>
    );
};

export default BankTransferModal;
