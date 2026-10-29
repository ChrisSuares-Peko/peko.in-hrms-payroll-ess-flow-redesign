import { SyncOutlined } from '@ant-design/icons';
import { Flex, Timeline, Typography } from 'antd';
import moment from 'moment';

import '../../assets/style.css';
import { TrackingDetail } from '../../types/tracking';

type TrackingTimelineProps = {
    trackerData: TrackingDetail[];
};
const { Text } = Typography;
const TrackingTimeline = ({ trackerData }: TrackingTimelineProps) => {
    if (!trackerData || trackerData.length === 0) return null;

    // Check if the last status is a terminal delivered state
    const lastItem = trackerData[trackerData.length - 1];
    const DELIVERED_STATUSES = ['Delivered', 'Rto Delivered'];
    const isDeliveredTimeline = DELIVERED_STATUSES.includes(lastItem.vendorStatus);

    const timelineItems = trackerData.map((item, index) => {
        const isLast = index === trackerData.length - 1;
        const isSecondLast = index === trackerData.length - 2;

        // Use yellow only when NOT delivered and this is the last item
        const highlightAsPending = !isDeliveredTimeline && isLast;

        return {
            className:
                !isDeliveredTimeline && isSecondLast
                    ? 'px-3 last-timeline-item'
                    : 'green-timeline px-3',
            dot: item.isMainStatus ? (
                <span
                    className="dot-large"
                    style={highlightAsPending ? { backgroundColor: '#FFAC33' } : {}}
                />
            ) : (
                <SyncOutlined
                    style={{
                        fontSize: 22,
                        color: highlightAsPending ? '#FFAC33' : 'green',
                    }}
                />
            ),
            children: (
                <Flex vertical className="pb-3" gap={7}>
                    <Text className={highlightAsPending ? 'text-[#FFAC33]' : 'text-green-500'}>
                        {item.status}
                    </Text>
                    <Text>{moment(item.timestamp).format('MMMM D, YYYY [at] h:mm A')}</Text>
                    <Text>{item.description}</Text>
                    {item.location && (
                        <Text type="secondary" className="text-xs">
                            {item.location}
                        </Text>
                    )}
                </Flex>
            ),
        };
    });
    return <Timeline items={timelineItems} />;
};
export default TrackingTimeline;
