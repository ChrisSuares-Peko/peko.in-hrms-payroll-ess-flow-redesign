import React, { useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Empty, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import { downloadUserDocument } from '../../api/documents';
import docFolder from '../../assets/icons/doc-folder.svg';
import docDownload from '../../assets/icons/doc-share.svg';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

const { Text } = Typography;

// Days-to-expiry threshold for the "Expiring Soon" badge.
const EXPIRING_DAYS = 60;

type BadgeKind = 'expired' | 'expiring' | 'ready' | null;

const badgeConfig: Record<
    Exclude<BadgeKind, null>,
    { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
    expiring: {
        label: 'Expiring Soon',
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#F6E397',
        icon: <ExclamationCircleFilled />,
    },
    ready: {
        label: 'Ready',
        color: '#26A411',
        bg: '#ECFDF3',
        border: '#A6F4C5',
        icon: <CheckCircleFilled />,
    },
    expired: {
        label: 'Expired',
        color: '#FF3A3A',
        bg: '#FFF1F0',
        border: '#FFCCC7',
        icon: <CloseCircleFilled />,
    },
};

const MyDocumentsTab: React.FC = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { profile } = useEmployeeProfile();
    const documents = profile?.employeeDocuments ?? [];
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async (documentId: string | undefined, url?: string, name?: string) => {
        if (!documentId || !url) return;
        setDownloadingId(documentId);
        setIsLoading(true);
        try {
            const blob = await downloadUserDocument({ userType: role, userId: id }, documentId);
            const extension = url.split('.').pop()?.split(/[?#]/)[0] || '';
            const employeeName = profile?.personalInformation?.fullName;
            const fileName = employeeName ? `${employeeName}_${name}` : name || 'document';
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = extension ? `${fileName}.${extension}` : fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } finally {
            setIsLoading(false);
            setDownloadingId(null);
        }
    };

    if (documents.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm mt-2">
                <Empty description="No documents on your profile yet" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-2">
            {documents.map((doc, index) => {
                const expiry = doc.expiryDate ? dayjs(doc.expiryDate) : null;
                const daysLeft = expiry ? expiry.diff(dayjs(), 'day') : null;

                let badge: BadgeKind = null;
                if (daysLeft !== null && daysLeft < 0) badge = 'expired';
                else if (daysLeft !== null && daysLeft <= EXPIRING_DAYS) badge = 'expiring';
                else if (!expiry) badge = 'ready';

                let subtitle = doc.holderName || '';
                let subtitleColor = '#64748B';
                if (expiry) {
                    const expired = badge === 'expired';
                    subtitle = `${expired ? 'Expired' : 'Expires'}: ${expiry.format('MMM YYYY')}`;
                    if (badge === 'expiring') subtitle += ` (${daysLeft} days)`;
                    if (expired) subtitleColor = '#FF3A3A';
                    else if (badge === 'expiring') subtitleColor = '#F59E0B';
                }
                const bdg = badge ? badgeConfig[badge] : null;

                return (
                    <div
                        key={doc._id ?? `${doc.name}-${index}`}
                        className="bg-white rounded-3xl p-6 border border-[#e4e7ec] flex flex-col gap-3 min-h-[190px]"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <img src={docFolder} alt="" style={{ width: 34, height: 52 }} />
                                {bdg && (
                                    <span
                                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-normal"
                                        style={{
                                            color: bdg.color,
                                            backgroundColor: bdg.bg,
                                            border: `0.5px solid ${bdg.border}`,
                                        }}
                                    >
                                        {bdg.icon}
                                        {bdg.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Text className="text-valueText font-semibold text-base">
                                    {doc.name}
                                </Text>
                                <Text
                                    className="text-sm min-h-[20px]"
                                    style={{ color: subtitleColor }}
                                >
                                    {subtitle}
                                </Text>
                            </div>
                        </div>

                        <div className="flex items-stretch">
                            <Button
                                disabled={!doc.url || !doc._id}
                                loading={isLoading && downloadingId === doc._id}
                                onClick={() => handleDownload(doc._id, doc.url, doc.name)}
                                className="flex-1 h-[40px] rounded-lg font-medium flex items-center justify-center gap-2"
                                style={{ color: '#FF4F4F', borderColor: '#FF4F4F' }}
                            >
                                <img src={docDownload} alt="" width={16} height={16} />
                                <span>Download</span>
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MyDocumentsTab;
