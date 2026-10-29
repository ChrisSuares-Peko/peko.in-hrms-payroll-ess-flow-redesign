import { ReloadOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import { getNextRefreshOn, isRefreshAllowed, nextRefreshMessage } from '../utils/vehicleRefresh';

type Props = {
    record: any;
    refreshingId: number | string | null;
    onRefresh: (target: { id: number | string; lastRefreshedAt?: string | null }) => void;
};

/** Ticket 31321: per-row replacement for the old common Refresh button above the table. */
const VehicleRefreshAction = ({ record, refreshingId, onRefresh }: Props) => {
    const isRefreshing = refreshingId === record?.id;
    const allowed = isRefreshAllowed(record?.lastRefreshedAt);

    // Left clickable while cooling down on purpose: the click is what tells the user when the next
    // refresh is due. It is answered locally, so it never reaches the vendor.
    return (
        <Tooltip
            title={
                allowed
                    ? 'Refresh'
                    : nextRefreshMessage(getNextRefreshOn(record?.lastRefreshedAt))
            }
        >
            <ReloadOutlined
                spin={isRefreshing}
                style={{
                    color: allowed ? '#FF4F4F' : '#BFBFBF',
                    cursor: refreshingId !== null ? 'not-allowed' : 'pointer',
                }}
                onClick={() =>
                    onRefresh({ id: record?.id, lastRefreshedAt: record?.lastRefreshedAt })
                }
            />
        </Tooltip>
    );
};

export default VehicleRefreshAction;
