import { useState } from 'react';

import { BulbOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import RequestBankUpdateModal from './RequestBankUpdateModal';
import { EmployeeBankDetails } from '../../api/onboarding';

const { Text } = Typography;

const FALLBACK = '—';

const mask = (value?: string | null) => (value ? `•••• •••• •••• ${value.slice(-4)}` : FALLBACK);

const Divider = () => <div className="border-t border-[#f0f0f0]" />;

interface BankDetailsTabProps {
    bankDetails?: EmployeeBankDetails | null;
    bankUpdateRequestPending?: boolean;
    onRequestSubmitted?: () => void;
}

const BankDetailsTab = ({
    bankDetails,
    bankUpdateRequestPending,
    onRequestSubmitted,
}: BankDetailsTabProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const hasBankData = Boolean(
        bankDetails?.bankName || bankDetails?.ifscCode || bankDetails?.accountNumber
    );
    const requestPending = !!bankUpdateRequestPending;

    return (
        <div className="bg-white rounded-3xl shadow-[0px_1.66px_16.56px_1.52px_rgba(0,0,0,0.06)] px-8 py-8">
            <Flex justify="space-between" align="center" className="mb-5">
                <Text className="text-xl font-semibold text-black">Bank Details</Text>
                <Button
                    danger={!requestPending}
                    disabled={requestPending}
                    size="large"
                    className="rounded-lg text-[12px] w-[150px] h-[41.5px] whitespace-nowrap"
                    onClick={() => setModalOpen(true)}
                >
                    {requestPending ? 'Request sent to HR' : 'Request Bank Update'}
                </Button>
            </Flex>

            {requestPending && (
                <Flex
                    align="center"
                    gap={8}
                    className="px-4 py-3 rounded-xl mb-5"
                    style={{ backgroundColor: '#FFF7E6', border: '0.5px solid #FFE7BA' }}
                >
                    <ClockCircleOutlined style={{ color: '#B26A00' }} />
                    <Text className="text-xs font-medium" style={{ color: '#B26A00' }}>
                        Your bank account update request is under HR review and will be reflected
                        after approval.
                    </Text>
                </Flex>
            )}

            <div className="rounded-[20px] border-[0.5px] border-[#cccccc]/80 p-[30px]">
                <Flex justify="space-between" align="center" className="mb-4">
                    <Text className="text-[12px] font-medium text-gray-400 uppercase">
                        Salary Account Details
                    </Text>
                    {hasBankData && (
                        <Flex
                            align="center"
                            gap={6}
                            className="px-3 py-1 rounded-full"
                            style={{
                                color: '#43b75d',
                                backgroundColor: '#ecfdf5',
                                border: '0.5px solid #c8f3df',
                            }}
                        >
                            <Text style={{ color: '#43b75d' }} className="text-xs font-medium">
                                Active
                            </Text>
                        </Flex>
                    )}
                </Flex>

                <Flex vertical gap={12}>
                    <Flex justify="space-between">
                        <Text className="text-sm text-gray-500">Bank Name</Text>
                        <Text className="text-sm font-medium text-black">
                            {bankDetails?.bankName || FALLBACK}
                        </Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between">
                        <Text className="text-sm text-gray-500">IFSC Code</Text>
                        <Text className="text-sm font-medium text-black">
                            {mask(bankDetails?.ifscCode)}
                        </Text>
                    </Flex>
                    <Divider />
                    <Flex justify="space-between">
                        <Text className="text-sm text-gray-500">Account Number</Text>
                        <Text className="text-sm font-medium text-black">
                            {mask(bankDetails?.accountNumber)}
                        </Text>
                    </Flex>
                </Flex>

                <Flex
                    align="center"
                    gap={10}
                    className="mt-6 px-4 py-4 rounded-xl"
                    style={{ background: '#f9f6ff' }}
                >
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                        style={{ background: '#6f3ed8' }}
                    >
                        <BulbOutlined style={{ color: '#ffffff' }} />
                    </div>
                    <Text className="text-xs text-gray-600">
                        To update your bank details, contact HR or submit a request below. Changes
                        typically take up to 3 business days to process.
                    </Text>
                </Flex>
            </div>

            <RequestBankUpdateModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                bankDetails={bankDetails}
                onSuccess={onRequestSubmitted}
            />
        </div>
    );
};

export default BankDetailsTab;
