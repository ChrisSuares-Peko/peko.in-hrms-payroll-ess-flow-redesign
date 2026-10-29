import React from 'react';

import { CheckCircleFilled, LogoutOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import { SessionInfo } from '../../types/eInvoice';

interface Props {
    session: SessionInfo;
    onRefresh?: () => void;
    onLogout?: () => void;
}

const SessionManagementCard: React.FC<Props> = ({ session, onRefresh, onLogout }) => (
    <Flex
        vertical
        gap={20}
        className="w-full p-4 md:p-6 bg-white rounded-2xl border border-[#E4E4E7]"
    >
        <TypographyText className="text-base font-semibold leading-6">
            Session Management
        </TypographyText>

        <Flex vertical gap={20}>
            <Flex vertical gap={8} className="px-3 py-3 bg-[#ECFDF5] rounded-xl">
                <Flex align="center" gap={4}>
                    <CheckCircleFilled style={{ color: '#16A34A', fontSize: 16 }} />
                    <TypographyText className="text-[#16A34A] text-sm font-semibold leading-5">
                        {session.isActive ? 'Session Active' : 'Session Inactive'}
                    </TypographyText>
                </Flex>
                <Flex align="center" className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                    <div
                        className="h-1.5 bg-[#16A34A] rounded-full"
                        style={{ width: `${session.progressPercent}%` }}
                    />
                </Flex>
                <TypographyText className="text-[#16A34A] text-sm font-normal leading-5">
                    {session.timeLeft}
                </TypographyText>
            </Flex>

            <Flex vertical gap={16}>
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12}>
                    <Flex vertical gap={2}>
                        <TypographyText className="text-[#475467] text-xs font-normal leading-4">
                            GSTIN
                        </TypographyText>
                        <TypographyText className="text-sm font-semibold leading-5">
                            {session.gstin}
                        </TypographyText>
                    </Flex>
                    <Flex vertical gap={2} align="flex-end">
                        <TypographyText className="text-[#475467] text-xs font-normal leading-4">
                            Client ID
                        </TypographyText>
                        <TypographyText className="text-sm font-semibold leading-5">
                            {session.clientId}
                        </TypographyText>
                    </Flex>
                </Flex>
                <Flex vertical gap={2}>
                    <TypographyText className="text-[#475467] text-xs font-normal leading-4">
                        Expires At
                    </TypographyText>
                    <TypographyText className="text-sm font-semibold leading-5">
                        {session.expiresAt}
                    </TypographyText>
                </Flex>
            </Flex>

            <Flex vertical gap={10}>
                {/* <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    block
                    className="h-10 bg-[#FF4F4F] border-[#FF4F4F] hover:!bg-[#e64444] hover:!border-[#e64444] text-white text-sm font-medium rounded-lg"
                >
                    Refresh
                </Button> */}
                <Button
                    icon={<LogoutOutlined />}
                    onClick={onLogout}
                    block
                    className="h-10 border-[#E4E4E7] text-sm font-medium rounded-lg"
                >
                    Logout
                </Button>
            </Flex>
        </Flex>
    </Flex>
);

export default SessionManagementCard;
