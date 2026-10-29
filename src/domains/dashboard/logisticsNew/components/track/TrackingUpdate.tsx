import TrackIconGreen from '@domains/dashboard/logisticsV2/assets/icons/tracking-green.svg';
import TrackIcon from '@domains/dashboard/logisticsV2/assets/icons/tracking.svg';
import { Divider, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';


import { TrackingDetail } from '../../types/tracking';

type Props = {
    data: TrackingDetail;
    isFirst: boolean;
    isLast: boolean;
};

const TrackingUpdate = ({ data, isFirst, isLast }: Props) => (
    <Flex gap={20}>
        <Flex vertical justify="start" align="center">
            <ReactSVG src={isFirst ? TrackIcon : TrackIconGreen} />
            {!isLast && (
                <Divider
                    type="vertical"
                    style={{
                        borderColor: '#05BE63',
                        borderLeftWidth: '2px',
                        minHeight: '120px',
                    }}
                />
            )}
        </Flex>
        <Flex vertical gap={10} className="w-9/12">
            <Typography.Text className="text-base font-medium">{data.status}</Typography.Text>
            <Typography.Paragraph className="truncate text-base">
                {new Date(data.timestamp).toLocaleString()}
            </Typography.Paragraph>
            <Typography.Text className="text-sm line-clamp-2">{data.note}</Typography.Text>
        </Flex>
    </Flex>
);
export default TrackingUpdate;
