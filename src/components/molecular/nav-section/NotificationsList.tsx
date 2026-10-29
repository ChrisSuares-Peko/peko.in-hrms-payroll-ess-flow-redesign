import { SmileOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';

import { emitCCNav } from '@src/domains/dashboard/corporateCards/utils/corporateCardsNav';
import { useAppSelector } from '@src/hooks/store';

import NotificationCard from './NotificationCard';

// Maps a notification category to the tab (and optional subtab) it should navigate to.
const CATEGORY_NAV: Record<string, { tab: string; subTab?: string }> = {
    UNFREEZE_REQUEST:  { tab: 'approval-requests', subTab: 'unfreeze-requests' },
    UNFREEZE_APPROVED: { tab: 'my-requests',       subTab: 'unfreeze-requests' },
    UNFREEZE_REJECTED: { tab: 'my-requests',       subTab: 'unfreeze-requests' },
};

const NotificationsList = () => {
    const { notifications } = useAppSelector(state => state.reducer.user);

    const handleNotificationClick = (category: string | undefined) => {
        if (!category) return;
        const nav = CATEGORY_NAV[category];
        if (!nav) return;
        emitCCNav(nav.tab, nav.subTab ? { subTab: nav.subTab } : undefined);
    };

    return (
        <div className=" max-h-80 overflow-y-scroll w-[24rem]">
            {notifications && notifications.data && notifications.data.length > 0 ? (
                Array.isArray(notifications?.data) &&
                notifications?.data?.map(notification => {
                    const category = (notification as Record<string, unknown>).notificationCategory as string | undefined;
                    const nav = category ? CATEGORY_NAV[category] : undefined;
                    return (
                        <NotificationCard
                            key={notification.id}
                            notification={notification.notificationBrief}
                            date={notification.createdAt}
                            notificationTitle={notification.notificationTitle}
                            onClick={nav ? () => handleNotificationClick(category) : undefined}
                        />
                    );
                })
            ) : (
                <Content style={{ textAlign: 'center' }} className="py-6">
                    <SmileOutlined className="text-gray-500" style={{ fontSize: 20 }} />
                    <p className="text-gray-500">No notifications available</p>
                </Content>
            )}
        </div>
    );
};

export default NotificationsList;
