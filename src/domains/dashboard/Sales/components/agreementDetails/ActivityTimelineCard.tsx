import { useState } from 'react';

import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import TypographyText from '@components/atomic/typography/typographyText';

interface TimelineEvent {
    createdAt: string;
    eventName: string;
}

const INITIAL_LIMIT = 5;

const ActivityTimelineCard = ({ timeline }: { timeline: TimelineEvent[] }) => {
    const [showAll, setShowAll] = useState(false);

    const visible = showAll ? timeline : timeline.slice(0, INITIAL_LIMIT);

    return (
        <Flex vertical className="rounded-2xl border border-[#E5E7EB] p-6 gap-5">
            <TypographyText className="text-sm font-semibold">Activity Timeline</TypographyText>
            <Flex vertical gap={8}>
                {visible.map((event, index) => (
                    <Flex key={index} align="center" gap={10} className="px-3 py-2 rounded-xl">
                        <CheckCircleOutlined style={{ color: '#43B75D', fontSize: 16, flexShrink: 0 }} />
                        <Flex vertical gap={1}>
                            <Typography.Text className="text-sm font-semibold text-green-700">
                                {event.eventName}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal text-[#71717A]">
                                {dayjs(event.createdAt).fromNow()}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
            {timeline.length > INITIAL_LIMIT && (
                <Button
                    type="link"
                    className="p-0 h-auto text-xs text-[#FF4F4F] self-start"
                    onClick={() => setShowAll(prev => !prev)}
                >
                    {showAll ? 'Show less' : `Show ${timeline.length - INITIAL_LIMIT} more`}
                </Button>
            )}
        </Flex>
    );
};

export default ActivityTimelineCard;
