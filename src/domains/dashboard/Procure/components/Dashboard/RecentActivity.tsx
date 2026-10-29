import React from 'react';

import { Card, Skeleton, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import newPurchaseOrder from '../../assets/icons/newPurchaseOrder.svg';
import newPurchaseReq from '../../assets/icons/newPurchaseReq.svg';
import newRFQIcon from '../../assets/icons/newRFQIcon.svg';
import recentActivityIcon from '../../assets/icons/recentActivityIcon.svg';
import { DashboardActivity } from '../../types';

const DEFAULT_VISIBLE = 5;

const TYPE_ICON: Record<string, string> = {
    INVOICE_RECEIVED:  newPurchaseReq,
    RFQ_CLOSED:        newRFQIcon,
    RFQ_AWARDED:       newRFQIcon,
    RFQ_SENT:          newRFQIcon,
    PO_SENT:           newPurchaseOrder,
    PO_CREATED:        newPurchaseOrder,
    PROPOSAL_RECEIVED: newPurchaseReq,
};

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
    activity: DashboardActivity[];
    isLoading: boolean;
}

const RecentActivity: React.FC<Props> = ({ activity, isLoading }) => {
    const navigate = useNavigate();

    const visibleActivity = activity.slice(0, DEFAULT_VISIBLE);
    const hasMore = activity.length > DEFAULT_VISIBLE;

    const renderContent = () => {
        if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;
        if (activity.length === 0) return (
            <div className="flex items-center justify-center h-[120px]">
                <span className="text-sm text-gray-400">No recent activity</span>
            </div>
        );
        return (
            <div className="flex flex-col gap-5">
                {visibleActivity.map((item, i) => (
                    <div key={`${item.refId}-${i}`} className="flex items-center gap-4 bg-white px-5 py-[19px] rounded-2xl border border-gray-100">
                        <div className="w-[54px] h-[54px] shrink-0 flex items-center justify-center">
                            <img
                                src={TYPE_ICON[item.type] ?? recentActivityIcon}
                                alt={item.type}
                                width={54}
                                height={54}
                            />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0">
                            <Tooltip title={item.message} placement="topLeft">
                                <p className="m-0 text-[14px] font-medium text-[#2F2B2A] leading-[22px] font-[Roboto] truncate">{item.message}</p>
                            </Tooltip>
                            <p className="m-0 text-[12.5px] font-regular text-[#8B8B8B] leading-5 font-[Roboto]">{formatDate(item.date)}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Card
            className="!rounded-[32px] h-full !border-gray-100 !bg-[#F9F9F9]"
            styles={{ body: { padding: 19 } }}
        >
            <div className="flex justify-between items-center mb-4">
                <h5 className="m-0 text-base font-semibold text-[#2F2B2A] font-[Roboto]">Recent Activity</h5>
                {hasMore && (
                    <button
                        type="button"
                        className="text-sm font-medium text-[#E8293A] bg-transparent border-none cursor-pointer p-0"
                        onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.activity}`)}
                    >
                        View all
                    </button>
                )}
            </div>
            {renderContent()}
        </Card>
    );
};

export default RecentActivity;
