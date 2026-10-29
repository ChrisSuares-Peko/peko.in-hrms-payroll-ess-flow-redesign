import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import { lastRefreshedMessage } from '../../utils/vehicleRefresh';

type Props = {
    lastRefreshedAt?: string | null;
    isRefreshing: boolean;
    onRefresh: () => void;
};

/** Ticket 31321: "Refresh Data" next to Delete Fleet, with the last refresh date underneath. */
const VehicleRefreshButton = ({ lastRefreshedAt, isRefreshing, onRefresh }: Props) => (
    <Flex vertical align="center" className="w-full sm:w-fit sm:items-end">
        <Button
            className="w-full px-6 border border-[#FF4F4F] text-[#FF4F4F] bg-transparent sm:w-fit"
            icon={<ReloadOutlined spin={isRefreshing} />}
            onClick={onRefresh}
            loading={isRefreshing}
        >
            Refresh Data
        </Button>
        {lastRefreshedAt && (
            <Typography.Text type="secondary" className="mt-1 text-xs">
                {lastRefreshedMessage(lastRefreshedAt)}
            </Typography.Text>
        )}
    </Flex>
);

export default VehicleRefreshButton;
