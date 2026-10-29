import { useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Typography } from 'antd';

import sentIcon from '../../assets/icons/Sent.svg';
import { Announcement } from '../../types';

interface AnnouncementsPanelProps {
    announcements: Announcement[];
}

const AnnouncementItem = ({ item }: { item: Announcement }) => (
    <Flex
        align="flex-start"
        justify="space-between"
        gap={16}
        className="px-6 py-4 bg-white border border-[#f0f0f0] rounded-2xl shadow-[0px_1px_2px_rgba(16,24,40,0.06)]"
    >
        <Flex vertical gap={6}>
            <Typography.Text className="text-base font-semibold text-[#141414]">
                {item.title}
            </Typography.Text>
            <Typography.Text className="text-sm text-[#707070]">{item.description}</Typography.Text>
        </Flex>
        <Flex align="center" className="px-[10px] py-[3px] rounded-full bg-[#ecfdf3] shrink-0">
            <span className="text-sm font-medium text-[#027a48] whitespace-nowrap">
                {item.date}
            </span>
        </Flex>
    </Flex>
);

const AnnouncementsPanel = ({ announcements }: AnnouncementsPanelProps) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const hasItems = announcements.length > 0;

    return (
        <Flex vertical className="h-full bg-[#f8f8f8] rounded-[32px] px-9 pt-9 pb-6">
            <Flex align="center" justify="space-between" className="mb-6">
                <Typography.Text className="text-[18px] font-medium text-[#171717]">
                    Announcements
                </Typography.Text>
                {hasItems && (
                    <Typography.Link
                        onClick={() => setDrawerOpen(true)}
                        className="text-base font-medium"
                        style={{ color: '#FF4F4F' }}
                    >
                        See all
                    </Typography.Link>
                )}
            </Flex>

            {hasItems ? (
                <Flex vertical gap={23}>
                    {announcements.map(item => (
                        <Flex
                            key={item.id}
                            align="flex-start"
                            justify="space-between"
                            gap={16}
                            className="px-6 py-3 bg-white rounded-2xl"
                        >
                            <Flex vertical gap={7}>
                                <Typography.Text className="text-base font-semibold text-[#141414]">
                                    {item.title}
                                </Typography.Text>
                                <Typography.Text className="text-sm text-[#707070]">
                                    {item.description}
                                </Typography.Text>
                            </Flex>
                            <Flex
                                align="center"
                                className="px-[10px] py-[3px] rounded-full bg-[#ecfdf3] shrink-0"
                            >
                                <span className="text-sm font-medium text-[#027a48] whitespace-nowrap">
                                    {item.date}
                                </span>
                            </Flex>
                        </Flex>
                    ))}
                </Flex>
            ) : (
                <Flex vertical align="center" justify="center" gap={10} className="flex-1 py-12">
                    <img src={sentIcon} alt="" className="w-28" />
                    <Typography.Text className="text-[#667085] text-sm">
                        No announcements right now
                    </Typography.Text>
                </Flex>
            )}

            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                placement="right"
                width={480}
                closable={false}
                title={
                    <Typography.Text className="text-2xl font-bold text-[#171717]">
                        All Announcements
                    </Typography.Text>
                }
                extra={
                    <Button
                        shape="circle"
                        icon={<CloseOutlined />}
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close announcements"
                    />
                }
                styles={{ body: { background: '#fafafa' } }}
            >
                <Flex vertical gap={16}>
                    {announcements.map(item => (
                        <AnnouncementItem key={item.id} item={item} />
                    ))}
                </Flex>
            </Drawer>
        </Flex>
    );
};

export default AnnouncementsPanel;
