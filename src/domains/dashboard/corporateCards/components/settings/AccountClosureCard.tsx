import { useState } from 'react';

import { Button, Flex, Skeleton, Tag, Typography } from 'antd';

import { formatCompleteDate } from '@utils/dateFormat';

import AccountClosureModal from './AccountClosureModal';
import { useAccountClosureApi } from '../../hooks/admin/useAccountClosureApi';

const { Text, Title } = Typography;

interface AccountClosureCardProps {
    companyName: string;
}

const AccountClosureCard = ({ companyName }: AccountClosureCardProps) => {
    const [open, setOpen] = useState(false);
    const { request, reasons, isLoading, submit, submitLoading, hasPendingRequest } =
        useAccountClosureApi();

    const handleSubmit = async (values: { reason: string; details: string }) => {
        const ok = await submit(values);
        if (ok) setOpen(false);
    };

    return (
        <div className="mt-6 rounded-2xl border border-errorTextRed/30 bg-bgLightPink px-6 py-5">
            {isLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} title={false} />
            ) : (
                <Flex
                    gap={20}
                    align="center"
                    justify="space-between"
                    className="flex-col sm:flex-row"
                >
                    <Flex vertical gap={6} className="w-full sm:max-w-[68%]">
                        <Title level={5} className="!mb-0 !text-textHeadings">
                            {`Close ${companyName}'s Peko Account`}
                        </Title>
                        <Text className="text-sm text-textBody">
                            Submitting this request will begin the account closure process. Once
                            confirmed by our support team, all the users will lose access, company
                            data will be deleted, and all the Corporate cards will be terminated.
                        </Text>
                        {hasPendingRequest && (
                            <Flex gap={8} align="center" wrap className="mt-1">
                                <Tag color="orange" className="!mr-0">
                                    Awaiting support review
                                </Tag>
                                <Text className="text-xs text-textGreyLight">
                                    {`${request?.reasonLabel ?? ''}${
                                        request?.requestedAt
                                            ? ` · requested ${formatCompleteDate(
                                                  new Date(request.requestedAt)
                                              )}`
                                            : ''
                                    }`}
                                </Text>
                            </Flex>
                        )}
                    </Flex>

                    <Button
                        type="primary"
                        disabled={hasPendingRequest}
                        onClick={() => setOpen(true)}
                        className="!h-12 w-full font-medium sm:w-auto"
                    >
                        Request account closure
                    </Button>
                </Flex>
            )}

            <AccountClosureModal
                open={open}
                companyName={companyName}
                reasons={reasons}
                submitLoading={submitLoading}
                onClose={() => setOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default AccountClosureCard;
