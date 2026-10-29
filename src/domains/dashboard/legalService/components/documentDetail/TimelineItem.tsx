import { CheckCircleOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface TimelineItemProps {
    iconSrc: string;
    title: string;
    description: string;
    date: string;
    active: boolean;
    isLast?: boolean;
    isSignedStep?: boolean;
}

const TimelineItem = ({ iconSrc, title, description, date, active, isLast, isSignedStep }: TimelineItemProps) => (
    <Flex gap={8} align="flex-start" className="relative">
        <Flex vertical align="center" className="shrink-0 pt-1">
            <Flex className="w-6 h-6" align="center" justify="center">
                {active && isSignedStep ? (
                    <CheckCircleOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                ) : (
                    <ReactSVG
                        src={iconSrc}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width:20px;height:20px;');
                            // Remove background box rects (those with fill but no meaningful stroke)
                            svg.querySelectorAll('rect').forEach(el => {
                                el.setAttribute('stroke', 'none');
                                el.setAttribute('fill', 'none');
                            });
                            svg.querySelectorAll('path,circle,polyline,line,polygon').forEach(el => {
                                el.setAttribute('stroke', active ? '#16a34a' : '#94a3b8');
                            });
                        }}
                    />
                )}
            </Flex>
            {!isLast && (
                <div
                    className="w-px mt-1"
                    style={{ height: 80, backgroundColor: active ? 'rgba(22,163,74,0.5)' : '#CBD5E1' }}
                />
            )}
        </Flex>

        <Flex
            vertical
            gap={4}
            className={`flex-1 p-3 rounded-xl mb-0 ${active ? 'bg-teal-50' : 'bg-stone-50'}`}
        >
            <Typography.Text className="!text-base !font-medium !text-black">
                {title}
            </Typography.Text>
            <Typography.Text className="!text-sm !text-stone-500 block">
                {description}
            </Typography.Text>
            {date && (
                <Typography.Text className="!text-xs !text-neutral-400">
                    {date}
                </Typography.Text>
            )}
        </Flex>
    </Flex>
);

export default TimelineItem;
